class Enemy{
	constructor(x,y,width,height,hp,speed,dmg,img){
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
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
		let x = pos.x;
		let y = pos.y;
		x -= this.x;
		y -= this.y;
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
			let point = {}
			let r1 = node.parent;
			let r2 = node;
			let r;	
			if(!r1){
				point.x = r2.x;
				point.y = r2.y;
			} else {
				if(collide({x:r1.x,y:r1.y-1,width:r1.width,height:r1.height},r2)){
					r = r1.width > r2.width?r2:r1;
					point.x = r.x + r.width/2;
					point.y = r.y + ((r === r2)?r.height:0);
					point.y-=2;
				}
				else if(collide({x:r1.x,y:r1.y+1,width:r1.width,height:r1.height},r2)){
					r = r1.width > r2.width?r2:r1;
					point.x = r.x + r.width/2;
					point.y = r.y + ((r === r1)?r.height:0);
				}
				else if(collide({x:r1.x-1,y:r1.y,width:r1.width,height:r1.height},r2)){
					r = r1.height > r2.height?r2:r1;
					point.x = r.x + ((r === r2)?r.width:0);
					point.y = r.y+r.height/2;
					point.x-=2;
				}
				else if(collide({x:r1.x+1,y:r1.y,width:r1.width,height:r1.height},r2)){
					r = r1.height > r2.height?r2:r1;
					point.x = r.x + ((r === r1)?r.width:0);
					point.y = r.y+r.height/2;
				}
			}
			this.path.push(new Obstacle(point.x, point.y, 1, 1));
			node = node.parent;
			it++;
		}
		this.path.pop();
		console.log(this.path.length)
	}
	setPath(width,height,obstacles,you,collide,tiles){
		//if(game.scene.time > 1) return;
		if(!game.scene.AI_DEBUG) return;
		/*let col = 50;
		let row = 50;
		let unitWidth = width/col;
		let unitHeight = height/row;
		let grid = new Array(col);
		for(let i = 0;i < grid.length; i++){
			grid[i] = new Array(row);
		}
		for(let x = 0; x < grid.length; x++){
			for(let y = 0; y < grid[x].length; y++){
				grid[x][y] = new AstarNode(x,y,unitWidth,unitHeight);
				for(let i = 0; i < obstacles.length; i++){
					let fakeNode = {x:x*unitWidth,y:y*unitHeight,width:unitWidth,height:unitHeight};
					if(collide(fakeNode,obstacles[i])){
						grid[x][y].wall = true;
					} 
				}
			}
		}
		for(let x = 0; x < grid.length; x++){
			for(let y = 0; y < grid[x].length; y++){
				grid[x][y].findNeighbors(grid);
			}
		}*/
		let start;
		let end;
		tiles.forEach(tile=>{
			if(collide({x:this.x,y:this.y,width:1,height:1},tile)){
				start = tile;
			}
			if(collide({x:you.x,y:you.y,width:1,height:1},tile)){
				end = tile;
			}
		});
		let openSet = [start];
		let closedSet = [];
		let dist = this.dist;
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
				this.loadPath(current);
				return current;
			}
			openSet = openSet.filter(i=>i!=current);
			closedSet.push(current);
			for(let i = 0; i < current.neighbors.length;i++){
				let neighbor = current.neighbors[i];
				if(closedSet.includes(neighbor) || neighbor.wall)
					continue;
				//let nonDiagonal = current.x == neighbor.x || current.y == neighbor.y;
				let tempG = current.g === undefined?0:current.g;
				tempG += dist(current.x,current.y,neighbor.x,neighbor.y);
				if(!openSet.includes(neighbor)){
					openSet.push(neighbor);
				} else {
					if(tempG >= neighbor.g)
						continue;
				}
				neighbor.parent = current;
				neighbor.g = tempG;
				neighbor.f = tempG + dist(neighbor.x,neighbor.y,end.x,end.y);
				//console.log(tempG)
			}
		}
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