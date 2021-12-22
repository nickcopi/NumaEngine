class Enemy extends Obstacle{
	constructor(x,y,width,height,hp,speed,dmg,img){
		super(x,y,width,height);
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
	}
	attack(time,hitFields){
		if(this.attackTime > time) return;
		this.attackTime = time + this.attackSpeed;
		this.activeHit = new HitField(this.x+this.width/2 + this.width/2*Math.cos(this.angle),this.y+this.height/2+ this.height/2*Math.sin(this.angle),this.width,this.height,this.dmg);
		hitFields.push(this.activeHit);
	}
	setDirection(you, collide){
		let pos = this.path[this.path.length-1];
		if(!pos)
			pos = you;
		let x = pos.getCenterX();
		let y = pos.getCenterY();
		x -= this.getCenterX();
		y -= this.getCenterY();
		let xPos = x > 0;
		let yPos = y > 0;
		let theta = Math.atan(Math.abs(y)/Math.abs(x));
		if(xPos && !yPos) theta = Math.PI/2 * 3 + (Math.PI/2 - theta);
		if(!xPos && !yPos) theta = Math.PI/2 * 2 + (theta);
		if(!xPos && yPos) theta = Math.PI/2 + (Math.PI/2 - theta);
		this.direction.x = Math.cos(theta);
		this.direction.y = Math.sin(theta);	
		this.angle = theta;
		if(this.path.length <= 0)
			this.needsPath = true;
		if(collide(pos,this)){
			console.log('hit')
			this.needsPath = true;
			this.path.pop();
		}
	}
	loadPath(endNode){
		this.needsPath = false;
		let node = endNode.parent;
		let collide = game.scene.collide;
		this.path = [];
		let it = 0;
		while(node){
			const waypointSize = 5;
			this.path.push(new Obstacle(node.x * node.width +node.width/2 - waypointSize/2, node.y * node.height + node.height/2 - waypointSize/2, waypointSize, waypointSize));
			const oldNode = node;
			node = node.parent;
			oldNode.parent = undefined;
		}
		this.path.pop();
		console.log(this.path.length)
	}
	setPath(you,grid){
		//if(game.scene.time > 1) return;
		if(!game.scene.AI_DEBUG) return;
		if(this.dist(you.x,you.y,this.x,this.y) > this.maxPathDistance) return;
		let start = grid.getPos(this.x+this.width/2,this.y+this.height/2);
		let end = grid.getPos(you.x+you.width/2,you.y+you.height/2);
		grid.clear();
		let openSet = [start];
		let closedSet = new Set();
		let dist = this.dist;
		const oldEndWall = end.wall;
		end.wall = false;
		while(openSet.length > 0){
			let winner = 0;
			openSet.forEach((open,i)=>{
				if(open.f < openSet[winner].f){
					winner = i;
				}
			});
			let current = openSet[winner];
			if(current === end) {
				end.wall = oldEndWall;
				this.loadPath(current);
				return current;
			}
			openSet = openSet.filter(i=>i!=current);
			closedSet.add(`${current.x},${current.y}`);
			const succesors = current.neighbors;//this.findSuccessors(current,end,grid);
			for(let i = 0; i < succesors.length;i++){
				let neighbor = current.neighbors[i];
				if(closedSet.has(`${neighbor.x},${neighbor.y}`) || neighbor.wall || grid.getDistance(start,current) > this.maxPathDistance)
					continue;
				//let nonDiagonal = current.x == neighbor.x || current.y == neighbor.y;
				let tempG = current.g === undefined?0:current.g;
				tempG += dist(current.x,current.y,neighbor.x,neighbor.y);
				if(tempG >= neighbor.g)
					continue;
				if(!openSet.includes(neighbor)){
					openSet.push(neighbor);
				}
				neighbor.parent = current;
				neighbor.g = tempG;
				neighbor.f = tempG + dist(neighbor.x,neighbor.y,end.x,end.y);
				//console.log(tempG)
			}
		}
		end.wall = oldEndWall;
	}
	findSuccessors(current,end,grid){
		const successors = [];
		current.neighbors.forEach(neighbor=>{
			let dX = neighbor.x - current.x;
			if(dX < -1) dX = -1;
			if(dX > 1) dX = 1;
			let dY = neighbor.y - current.y;
			if(dY < -1) dY = -1;
			if(dY > 1) dY = 1;
			const jumpPoint = this.jumpPath(current,dX,dY,end,grid);
			if(jumpPoint) successors.push(jumpPoint);
		});
		return successors;
	}
	jumpPath(current,dX,dY,end,grid){
		const x = current.x + dX;
		const y = current.y + dY;
		const next = grid.getNode(x,y);
		if(!next) return;
		if(next.wall) return current;
		if(next === end) return end;
		if(dX !== 0 && dY !== 0){
			if((!grid.isWall(x-dX,y+dY) && grid.isWall(x-dX,y)) || (!grid.isWall(x+dX,y-dY) && grid.isWall(x,y-dY)))
				return next;
		}
		if(dX !== 0){
			if((!grid.isWall(x+dX,y+1) && grid.isWall(x,y+1)) || (!grid.isWall(x+dX,y-1) && grid.isWall(x,y-1)))
				return next;
		}
		if(dY !== 0){
			if((!grid.isWall(x+1,y+dY) && grid.isWall(x+1,y)) || (!grid.isWall(x-1,y+dY) && grid.isWall(x-1,y)))
				return next;
		}
		return this.jumpPath(next,dX,dY,end,grid);
	}
	move(obstacles,you,width,height){
		if(this.attackTime > game.scene.time) return;
		if(this.attackTime === game.scene.time && this.activeHit)
			this.activeHit.active = false;
		if(this.dist(this.x,this.y,you.x,you.y) <= this.width){
			this.attack(game.scene.time,game.scene.hitFields);
			return;
		}
		let speed = this.speed;
		if(this.slowed > game.scene.time) speed /= 2;
		this.x += speed * this.direction.x;
		this.y += speed * this.direction.y;
		obstacles.forEach(obstacle=>{
			if(game.scene.collide(obstacle,this)){
				this.needsPath = true;
				game.scene.backOffCollide(obstacle,this);
			}
		});
		game.scene.enemies.forEach(enemy=>{
			if(game.scene.collide(enemy,this)){
				//console.log(enemy.slowed, game.scene.time)
				if(enemy.slowed <= game.scene.time){

					this.slowed = game.scene.time + 20;
				}
				//game.scene.backOffCollide(enemy,this);
				//consider slowing the enemy down a bit or something idk
			}
		});
		if(this.x < 0) this.x = 0;
		if(this.y < 0) this.y = 0;
		if(this.x + this.width > width) this.x = width - this.width;
		if(this.y + this.height > height) this.y = height - this.height;
	}
	dist(x1,y1,x2,y2){
		return Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2));
	}
	render(ctx,adjusted){
		ctx.save();
		ctx.translate(adjusted.x+this.width/2,adjusted.y+this.height/2);
		ctx.rotate(this.angle);
		ctx.drawImage(this.img, -(this.width/2),-(this.height/2),this.width, this.height);
		ctx.restore();
		ctx.fillStyle = 'red'; 
		ctx.fillRect(adjusted.x,adjusted.y + this.height + 5,this.width,5);
		ctx.fillStyle = 'green';
		ctx.fillRect(adjusted.x,adjusted.y + this.height + 5,this.width * this.hp/this.maxHp,5);
	}
}
