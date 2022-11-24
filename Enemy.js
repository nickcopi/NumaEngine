class Enemy extends Obstacle {
	constructor(x, y, width, height, hp, speed, dmg, img) {
		super(x, y, width, height);
		this.speed = speed;
		this.dmg = dmg;
		this.hp = hp;
		this.maxHp = this.hp;
		this.img = img;
		this.id = Math.random() * Math.random();
		this.angle = 0;
		this.direction = {};
		this.path = [];
		this.needsPath = true;
		this.attackTime = 0;
		this.attackSpeed = 60;
		this.slowed = 0;
		this.maxPathDistance = 750;
		this.repathTime = 0;
	}
	attack(time, hitFields) {
		if (this.attackTime > time) return;
		this.attackTime = time + this.attackSpeed;
		this.activeHit = new HitField(this.x + this.width / 2 + this.width / 2 * Math.cos(this.angle), this.y + this.height / 2 + this.height / 2 * Math.sin(this.angle), this.width, this.height, this.dmg);
		hitFields.push(this.activeHit);
	}
	setDirection(you, collide) {
		let pos = this.path[this.path.length - 1];
		if (!pos)
			pos = you;
		let x = pos.getCenterX();
		let y = pos.getCenterY();
		x -= this.getCenterX();
		y -= this.getCenterY();
		let xPos = x > 0;
		let yPos = y > 0;
		let theta = Math.atan(Math.abs(y) / Math.abs(x));
		if (xPos && !yPos) theta = Math.PI / 2 * 3 + (Math.PI / 2 - theta);
		if (!xPos && !yPos) theta = Math.PI / 2 * 2 + (theta);
		if (!xPos && yPos) theta = Math.PI / 2 + (Math.PI / 2 - theta);
		this.direction.x = Math.cos(theta);
		this.direction.y = Math.sin(theta);
		this.angle = theta;
		if (this.path.length <= 0)
			this.needsPath = true;
		if (collide(pos, this)) {
			console.log('hit')
			this.needsPath = true;
			this.path.pop();
		}
	}
	loadPath(endNode) {
		this.needsPath = false;
		let node = endNode.parent;
		let collide = game.scene.collide;
		this.path = [];
		let it = 0;
		while (node) {
			const waypointSize = 5;
			this.path.push(new Obstacle(node.x * node.width + node.width / 2 - waypointSize / 2, node.y * node.height + node.height / 2 - waypointSize / 2, waypointSize, waypointSize));
			const oldNode = node;
			node = node.parent;
			oldNode.parent = undefined;
		}
		this.path.pop();
		console.log(this.path.length)
	}
	clearNodes(list) {
		list.forEach(node => node.reset());
	}
	checkRepath(time) {
		if (time > this.repathTime + 15) {
			this.needsPath = true;
			this.repathTime = time;
		}
	}
	setPath(you, grid) {
		//if(game.scene.time > 1) return;
		//if(!game.scene.AI_DEBUG) return;
		if (this.dist(you.x, you.y, this.x, this.y) > this.maxPathDistance) return;
		let start = grid.getPos(this.x + this.width / 2, this.y + this.height / 2);
		let end = grid.getPos(you.x + you.width / 2, you.y + you.height / 2);
		let openSet = [start];
		const toClear = [start];
		start.open = true;
		let dist = this.dist;
		const oldEndWall = end.wall;
		end.wall = false;
		while (openSet.length > 0) {
			let winner = 0;
			openSet.forEach((open, i) => {
				if (open.f < openSet[winner].f) {
					winner = i;
				}
			});
			let current = openSet[winner];
			if (current === end) {
				end.wall = oldEndWall;
				this.loadPath(current);
				this.clearNodes(toClear);
				return current;
			}
			openSet = openSet.filter(i => i != current);
			current.open = undefined;
			current.closed = true;
			const successors = this.findSuccessors(current, end, grid);
			//const successors = current.neighbors;
			for (let i = 0; i < successors.length; i++) {
				let neighbor = successors[i];
				if (neighbor.closed || neighbor.wall || grid.getDistance(start, current) > this.maxPathDistance)
					continue;
				let tempG = current.g === undefined ? 0 : current.g;
				tempG += dist(current.x, current.y, neighbor.x, neighbor.y);
				if (tempG >= neighbor.g)
					continue;
				if (!neighbor.open) {
					neighbor.open = true;
					openSet.push(neighbor);
				}
				toClear.push(neighbor);
				neighbor.parent = current;
				neighbor.g = tempG;
				neighbor.f = tempG + dist(neighbor.x, neighbor.y, end.x, end.y);
				//console.log(tempG)
			}
		}
		end.wall = oldEndWall;
		this.clearNodes(toClear);
	}
	findNeighbors(node, grid) {
		if (!node.parent) return node.neighbors;
		const neighbors = [];
		const x = node.x;
		const y = node.y;
		const dX = (x - node.parent.x) / Math.max(Math.abs(x - node.parent.x), 1);
		const dY = (y - node.parent.y) / Math.max(Math.abs(y - node.parent.y), 1);
		if (dX && dY) {
			let walkX, walkY;
			if (!grid.isWall(x, y + dY)) {
				neighbors.push(grid.getNode(x, y + dY));
				walkY = true;
			}
			if (!grid.isWall(x + dX, y)) {
				neighbors.push(grid.getNode(x + dX, y));
				walkX = true;
			}
			if (walkY || walkX)
				neighbors.push(grid.getNode(x + dX, y + dY));
			if (grid.isWall(x - dX, y) && walkY)
				neighbors.push(grid.getNode(x - dX, y + dY));
			if (grid.isWall(x, y - dY) && walkX)
				neighbors.push(grid.getNode(x + dX, y - dY));
		} else {
			if (dY) {
				if (!grid.isWall(x, y + dY))
					neighbors.push(grid.getNode(x, y + dY));
				if (grid.isWall(x + 1, y))
					neighbors.push(grid.getNode(x + 1, y + dY));
				if (grid.isWall(x - 1, y))
					neighbors.push(grid.getNode(x - 1, y + dY));
			} else {
				if (!grid.isWall(x + dX, y))
					neighbors.push(grid.getNode(x + dX, y));
				if (grid.isWall(x, y + 1))
					neighbors.push(grid.getNode(x + dX, y + 1));
				if (grid.isWall(x, y - 1))
					neighbors.push(grid.getNode(x + dX, y - 1));
			}
		}
		return neighbors.filter(Boolean);
	}
	findSuccessors(current, end, grid) {
		const successors = [];
		this.findNeighbors(current, grid).forEach(neighbor => {
			const jumpPoint = this.jumpPath(neighbor, current, end, grid);
			if (jumpPoint) successors.push(jumpPoint);
		});
		return successors;
	}
	jumpPath(next, parent, end, grid) {
		if (!next) return;
		const x = next.x
		const y = next.y
		const dX = next.x - parent.x;
		const dY = next.y - parent.y;
		if (next.wall) return;
		if (next === end) return end;
		if (dX !== 0 && dY !== 0) {
			if ((!grid.isWall(x - dX, y + dY) && grid.isWall(x - dX, y)) || (!grid.isWall(x + dX, y - dY) && grid.isWall(x, y - dY)))
				return next;
		} else {
			if (dX !== 0) {
				if ((!grid.isWall(x + dX, y + 1) && grid.isWall(x, y + 1)) || (!grid.isWall(x + dX, y - 1) && grid.isWall(x, y - 1)))
					return next;
			}
			if (dY !== 0) {
				if ((!grid.isWall(x + 1, y + dY) && grid.isWall(x + 1, y)) || (!grid.isWall(x - 1, y + dY) && grid.isWall(x - 1, y)))
					return next;
			}
		}
		if (dX !== 0 && dY !== 0) {
			/*const horizontal = this.jumpPath(grid.getNode(x+dX,y),next,end,grid);
			if(horizontal) return horizontal;
			const vertical = this.jumpPath(grid.getNode(x,y+dY),next,end,grid);
			if(vertical) return vertical;*/
			if (this.jumpPath(grid.getNode(x + dX, y), next, end, grid)) return next;
			if (this.jumpPath(grid.getNode(x, y + dY), next, end, grid)) return next;
		}
		if (!grid.isWall(x + dX, y) || !grid.isWall(x, y + dY))
			return this.jumpPath(grid.getNode(x + dX, y + dY), next, end, grid);
	}
	move(obstacles, you, width, height) {
		if (this.attackTime > game.scene.time) return;
		if (this.attackTime === game.scene.time && this.activeHit)
			this.activeHit.active = false;
		if (this.dist(this.x, this.y, you.x, you.y) <= this.width) {
			this.attack(game.scene.time, game.scene.hitFields);
			return;
		}
		let speed = this.speed;
		if (this.slowed > game.scene.time) speed /= 2;
		this.x += speed * this.direction.x;
		this.y += speed * this.direction.y;
		obstacles.forEach(obstacle => {
			if (game.scene.collide(obstacle, this)) {
				this.needsPath = true;
				game.scene.backOffCollide(obstacle, this);
			}
		});
		game.scene.enemies.forEach(enemy => {
			if (game.scene.collide(enemy, this)) {
				//console.log(enemy.slowed, game.scene.time)
				if (enemy.slowed <= game.scene.time) {

					this.slowed = game.scene.time + 20;
				}
				//game.scene.backOffCollide(enemy,this);
				//consider slowing the enemy down a bit or something idk
			}
		});
		if (this.x < 0) this.x = 0;
		if (this.y < 0) this.y = 0;
		if (this.x + this.width > width) this.x = width - this.width;
		if (this.y + this.height > height) this.y = height - this.height;
	}
	dist(x1, y1, x2, y2) {
		return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
	}
	render(ctx, adjusted) {
		ctx.save();
		ctx.translate(adjusted.x + this.width / 2, adjusted.y + this.height / 2);
		ctx.rotate(this.angle);
		ctx.drawImage(this.img, -(this.width / 2), -(this.height / 2), this.width, this.height);
		ctx.restore();
		ctx.fillStyle = 'red';
		ctx.fillRect(adjusted.x, adjusted.y + this.height + 5, this.width, 5);
		ctx.fillStyle = 'green';
		ctx.fillRect(adjusted.x, adjusted.y + this.height + 5, this.width * this.hp / this.maxHp, 5);
	}
}
