let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');


class Game{
	constructor(){
		this.sprites = {
			enemy: new Image(),
			bg: new Image(),
			you: new Image()
		}
		this.sprites.enemy.src = 'enemy.png';
		this.sprites.bg.src = 'bg.png';
		this.sprites.you.src = 'you.png';
		this.settings = new Settings();
		this.scene = new Scene(canvas.width/2,canvas.height/2,3000,3000,this.settings,this.sprites);
		

	}

}

class Settings{
	constructor(){
		this.UP_KEY = 87;
		this.DOWN_KEY = 83;
		this.LEFT_KEY = 65;
		this.RIGHT_KEY = 68;
	}
}
class AstarNode{
	constructor(x,y,width,height){
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.h = 0;
		/*this.g = 0; // g is acquired score*/
		this.f = 0;
		this.wall = false;
		this.neighbors = [];
	}
	findNeighbors(grid){
		let x = this.x;
		let y = this.y;
		let col = grid.length;
		let row = grid[0].length;
		if(x > 0) this.neighbors.push(grid[x-1][y]);
		if(y > 0) this.neighbors.push(grid[x][y-1]);
		if(x < col-1) this.neighbors.push(grid[x+1][y]);
		if(y < row-1) this.neighbors.push(grid[x][y+1]);
		if(x < col-1 && y > 0) this.neighbors.push(grid[x+1][y-1]);
		if(x < col-1 && y < row-1) this.neighbors.push(grid[x+1][y+1]);
		if(x > 0 && y > 0) this.neighbors.push(grid[x-1][y-1]);
		if(x > 0 && y < row-1) this.neighbors.push(grid[x-1][y+1]);
	}
}

class Scene{
	constructor(youX,youY,width,height,settings,sprites){
		this.settings = settings;
		this.sprites = sprites;
		this.width = width;
		this.height = height;
		this.bullets = [];
		this.obstacles = [];
		this.enemies = [];
		this.faders = [];
		this.hitFields = [];
		this.obstacles.push(new Obstacle(600,20,200,200));
		this.obstacles.push(new Obstacle(100,240,700,50));
		this.enemies.push(new Enemy(0,10,20,20,100,2,20,this.sprites.enemy));
		this.keys = [];
		this.time = 0;
		this.AI_DEBUG = false;
		this.HIT_DEBUG = false;
		this.gridLines = [];
		this.bg = new Background(0,0,width,height,this.sprites.bg);
		for(let i = 0; i < width/50;i++){
			this.gridLines.push(new Obstacle(i * (width/50),0,1,width));
		}
		for(let i = 0; i < height/50;i++){
			this.gridLines.push(new Obstacle(0,i * (height/50),height,1));
		}
		this.you = new You(youX,youY,this.sprites.you);
		//this.nodePath = this.enemies[0].setPath(this.width,this.height,this.obstacles,this.you,this.collide);
		setInterval(()=>{
			this.update();
			this.render();
		},1000/60);
	}
	update(){
		this.time++;
		this.fadeFaders();
		this.you.shoot();
		if(this.you.weapon.reloading){
			this.you.weapon.reload();
		}
		this.bullets.forEach(bullet=>{
			bullet.move();
		});
		this.hitFields = this.hitFields.filter(hitField=>{
			hitField.hit(this.you,this.collide);
			return hitField.active;
		});
		this.enemies.forEach(enemy=>{
			if(enemy.needsPath) enemy.setPath(this.width,this.height,this.obstacles,this.you,this.collide);
			enemy.setDirection(this.you,this.collide);
			enemy.move(this.obstacles,this.you,this.width,this.height);
		})
		this.bulletCollide();
		this.handleInput();
		this.checkBounds();
	}
	fadeFaders(){
		this.faders = this.faders.filter(fader=>{
			fader.fade();
			return fader.alive();
		});
	}
	bulletCollide(){
		this.bullets = this.bullets.filter(bullet=>{
			this.enemies = this.enemies.filter(enemy=>{
				if(this.collide(bullet,enemy)){
					if(!bullet.hits.includes(enemy.id) && bullet.pierce > 0){
						enemy.hp -= bullet.damage;
						this.faders.push(new HitText(bullet.x,bullet.y,`-${bullet.damage}`));
						bullet.hits.push(enemy.id);
						bullet.pierce--;
					}
					if(enemy.hp <= 0)
						return false;
				}
				return true;
			});
			this.obstacles.forEach(obs=>{
				if(this.collide(bullet,obs)){
					if(!obs.allowBullets) bullet.pierce = 0;
					//bullet.setAngle(bullet.angle + Math.PI/2);
				}
			});
			if(bullet.pierce <= 0)
				return false;
			return true;
		});
	}
	checkBounds(){
		this.obstacles.forEach(obs=>{
			if(this.collide(obs,this.you)){
				this.backOffCollide(obs,this.you);
			}
		});
		this.bullets = this.bullets.filter(bullet=>{
			return !(bullet.x + bullet.width < 0 ||
				bullet.x > this.width ||
				bullet.y + bullet.height < 0 ||
				bullet.y > this.height);
		});
		if(this.you.x < 0) this.you.x = 0;
		if(this.you.x + this.you.width > this.width) this.you.x = this.width - this.you.width;
		if(this.you.y < 0) this.you.y = 0;
		if(this.you.y + this.you.height > this.height) this.you.y = this.height - this.you.height;

	}
	collide(o1,o2){
		return o1.x < o2.x + o2.width && o1.x + o1.width > o2.x && o1.y < o2.y + o2.height && o1.y + o1.height > o2.y;
	}
	/*o1 is immobile, o2 will be moved*/
	backOffCollide(o1,o2){
		let pushLeft = Math.abs(o1.x - (o2.x + o2.width));
		let pushRight = Math.abs((o1.x + o1.width) - o2.x);
		let pushUp = Math.abs(o1.y - (o2.y + o2.height));
		let pushDown = Math.abs((o1.y + o1.height) - o2.y);
		let options = [pushLeft,pushRight,pushUp,pushDown];
		switch(options.indexOf(Math.min(...options))){
			case 0:
			o2.x = o1.x - o2.width;
			break;
			case 1:
			o2.x = o1.x + o1.width;
			break;
			case 2:
			o2.y = o1.y - o2.height;
			break;
			case 3:
			o2.y = o1.y + o1.height;
			break;
		}
	}
	handleInput(){
		if(this.keys[this.settings.UP_KEY]){
			this.you.y -= this.you.speed;
		}
		if(this.keys[this.settings.DOWN_KEY]){
			this.you.y += this.you.speed;
		}
		if(this.keys[this.settings.LEFT_KEY]){
			this.you.x -= this.you.speed;
		}
		if(this.keys[this.settings.RIGHT_KEY]){
			this.you.x += this.you.speed;
		}
		
	}
	/*Creates a shifted x and y of things to be drawn based on you. Returns nothing if x and y are off map.*/
	cameraOffset(obj){
		let adjustedX = (obj.x - (this.you.x)) + canvas.width/2;
		let adjustedY = (obj.y - (this.you.y)) + canvas.height/2;
		let oWidth = obj.width === undefined ? 0 : obj.width;
		let oHeight = obj.height === undefined ? 0 : obj.height;
		if(adjustedX + oWidth < 0 || adjustedX > canvas.width || adjustedY > canvas.height || adjustedY + oHeight < 0)
			return;
		return{
			x:adjustedX,
			y:adjustedY
		};
	}
	render(){
		let you = this.you;
		ctx.clearRect(0,0,canvas.width,canvas.height);
		ctx.fillStyle = 'black';
		ctx.fillRect(0,0,canvas.width,canvas.height);

		/*Draw background*/
		let adjusted = this.cameraOffset(this.bg);
		if(adjusted) ctx.drawImage(this.bg.img,adjusted.x,adjusted.y,this.bg.width,this.bg.height);

		if(this.AI_DEBUG){
			ctx.fillStyle = 'white';
			this.gridLines.forEach(line=>{
				let adjusted = this.cameraOffset(line);
				if(adjusted) ctx.fillRect(adjusted.x,adjusted.y,line.width,line.height);
			});
		}

		/*Draw you*/
		ctx.save();
		ctx.translate(canvas.width/2 + (you.width/2),canvas.height/2 + (you.height/2));
		ctx.rotate(you.angle);
		ctx.drawImage(you.img, you.width/-2,you.height/-2,you.width,you.height);
		ctx.restore();

		ctx.fillStyle = 'red';
		ctx.fillRect(canvas.width/2,canvas.height/2 + you.height + 5, you.width,5);
		ctx.fillStyle = 'green';
		ctx.fillRect(canvas.width/2,canvas.height/2 + you.height + 5,you.width * you.hp/you.maxHp,5);


		ctx.fillStyle = 'black';
		this.bullets.forEach(bullet=>{
			let adjusted = this.cameraOffset(bullet);
			if(adjusted) ctx.fillRect(adjusted.x,adjusted.y,bullet.width,bullet.height);
		});


		ctx.fillStyle = 'gray';
		this.obstacles.forEach(obstacle=>{
			let adjusted = this.cameraOffset(obstacle);
			if(adjusted) ctx.fillRect(adjusted.x,adjusted.y,obstacle.width,obstacle.height);
		});
		ctx.strokeStyle = 'red';
		this.enemies.forEach(enemy=>{
			let adjusted = this.cameraOffset(enemy);
			if(adjusted){
				ctx.save();
				ctx.translate(adjusted.x+enemy.width/2,adjusted.y+enemy.height/2);
				ctx.rotate(enemy.angle);
				ctx.fillStyle = 'red'; 
				ctx.drawImage(enemy.img, -(enemy.width/2),-(enemy.height/2),enemy.width, enemy.height);
				ctx.restore();
				ctx.fillRect(adjusted.x,adjusted.y + enemy.height + 5,enemy.width,5);
				ctx.fillStyle = 'green';
				ctx.fillRect(adjusted.x,adjusted.y + enemy.height + 5,enemy.width * enemy.hp/enemy.maxHp,5);
			}
			if(this.AI_DEBUG){
				ctx.beginPath();
				ctx.lineTo(canvas.width/2,canvas.height/2)
				enemy.path.forEach(path=>{
					let adjusted = this.cameraOffset(path);
					if(adjusted) ctx.lineTo(adjusted.x,adjusted.y);
				});
				if(adjusted) ctx.lineTo(adjusted.x,adjusted.y);
				ctx.stroke();
			}
		});
		if(this.HIT_DEBUG){
			ctx.globalAlpha = .2;
			this.hitFields.forEach(hitField=>{
				let adjusted = this.cameraOffset(hitField);
				if(adjusted && hitField.active) ctx.fillRect(adjusted.x,adjusted.y,hitField.width,hitField.height);
			});
			ctx.globalAlpha = 1;
		}
		ctx.fillStyle = 'black'; 
		this.faders.forEach((fader)=>{
			ctx.globalAlpha = fader.opacity;
			let adjusted = this.cameraOffset(fader);
			if(adjusted) ctx.fillText(fader.text,adjusted.x,adjusted.y+10);

		});
		ctx.globalAlpha = 1;
	}
}

class Obstacle{
	constructor(x,y,width,height){
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}
}

class Waypoint{
	constructor(x,y){
		this.x = x;
		this.y = y;
		this.width = 1;
		this.height = 1;
	}
}

class HitText{
	constructor(x,y,text){
		this.opacity = 1;
		this.x = x;
		this.y = y;
		this.text = text;
	}
	fade(){
		this.opacity -= (1/70);	
	}
	alive(){
		return this.opacity > 0;
	}
}

class HitField{
	constructor(x,y,width,height,dmg){
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.active = true;
		this.dmg = dmg;
	}
	hit(target,collide){
		if(!this.active) return;
		if(collide(this,target)){
			this.active = false;
			target.damage(this.dmg);
		}
	}
}

class Background{
	constructor(x,y,width,height,img){
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.img = img;
	}
}

class Weapon{
	constructor(speed,spread,flechettes,pierce,fireDelay,damage,radius, capacity, reload,auto){
		this.speed = speed;
		this.spread = spread;
		this.flechettes = flechettes;
		this.pierce = pierce;
		this.fireDelay = fireDelay;
		this.damage = damage;
		this.radius = radius;
		this.timeout = 0;
		this.capacity = capacity;
		this.reloadBase = reload;
		this.auto = auto;
		this.mag = capacity;
		this.reloading = false;
	} 
	shoot(you,x,y){
		if(this.timeout > game.scene.time || this.mag <= 0 || this.reloading)
			return;
		for(let i = -this.spread/2;i<this.spread/2;i+=this.spread/this.flechettes){
			let bullet = new Bullet(you.getCenter().x,you.getCenter().y,this.speed,this.damage,this.pierce,this.radius);
			bullet.setDirection(you.angle,i);
			game.scene.bullets.push(bullet);
		}
		this.mag--;
		if(this.mag === 0){
			this.reloadTime = game.scene.time + this.reloadBase;
			this.reloading = true;
		}
		this.timeout = game.scene.time + this.fireDelay;
	}
	reload(){
		if(this.reloadTime <= game.scene.time){
			this.mag = this.capacity;
			this.reloading = false;
		}
	}
}

class You{
	constructor(x,y,img){
		this.x = x;
		this.y = y;
		this.speed = 4;
		this.width = 20;
		this.height = 20;
		this.weapon = new Weapon(15,Math.PI/8,5,2,10,10,2,5,30,true);
		this.shooting = false;
		this.angle = 0;
		this.img = img;
		this.maxHp = 100;
		this.hp = 100;
	}
	getCenter(){
		return {
			x: this.x+this.width/2,
			y: this.y+this.height/2
		}
	}
	damage(dmg){
		this.hp -= dmg;
		if(this.hp <= 0)
			return; /*handle player death*/
	}
	shoot(){
		if(this.shooting){
			if(!this.weapon.auto)
				this.shooting = false;
			this.weapon.shoot(this,this.aimX, this.aimY);
		}
	}
	setAngle(e){
		let x = e.offsetX - canvas.width/2;
		let y = e.offsetY - canvas.height/2;
		let xPos = x > 0;
		let yPos = y > 0;
		let theta = Math.atan(Math.abs(y)/Math.abs(x));
		if(xPos && !yPos) theta = Math.PI/2 * 3 + (Math.PI/2 - theta);
		if(!xPos && !yPos) theta = Math.PI/2 * 2 + (theta);
		if(!xPos && yPos) theta = Math.PI/2 + (Math.PI/2 - theta);
		this.angle = theta;
	}
}

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
			this.needsPath = true;
			this.path.pop();
		}
	}
	loadPath(endNode){
		this.needsPath = false;
		let node = endNode.parent;
		this.path = [];
		while(node){
			this.path.push(new Obstacle(node.x * node.width, node.y * node.height, 5, 5));
			node = node.parent;
		}
		this.path.pop();
	}
	setPath(width,height,obstacles,you,collide){
		return;
		let col = 50;
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
		}
		let start = grid[Math.floor(this.x/unitWidth)][Math.floor(this.y/unitHeight)];
		let end = grid[Math.floor(you.x/unitWidth)][Math.floor(you.y/unitHeight)];
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
				let nonDiagonal = current.x == neighbor.x || current.y == neighbor.y;
				let tempG = current.g === undefined?0:current.g;
				tempG += nonDiagonal?1:Math.sqrt(2);
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
		this.x += this.speed * this.direction.x;
		this.y += this.speed * this.direction.y;
		obstacles.forEach(obstacle=>{
			if(game.scene.collide(obstacle,this)){
				game.scene.backOffCollide(obstacle,this);
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
}

class Bullet {
	constructor(x,y,speed,damage,pierce,radius){
		this.x = x;
		this.y = y;
		this.width = radius;
		this.height = radius;
		this.speed = speed;
		this.damage = damage;
		this.pierce = pierce;
		this.hits = [];
		this.angle = 0;
		this.direction = {};
	}
	setDirection(theta,spread){
		theta += spread
		this.direction.x = Math.cos(theta);
		this.direction.y = Math.sin(theta);	
		this.angle = theta;
	}
	move(){
		this.x += this.speed * this.direction.x;
		this.y += this.speed * this.direction.y;
	}

}
let game;
canvas.addEventListener('mousedown',(e)=>{
	let you = game.scene.you;
	you.setAngle(e);
	you.aimX = e.offsetX - canvas.width/2;
	you.aimY = e.offsetY - canvas.height/2;
	you.shooting = true;
});
canvas.addEventListener('mouseup',(e)=>{
	game.scene.you.shooting = false;
});
canvas.addEventListener('mousemove',(e)=>{
	let you = game.scene.you;
	you.setAngle(e);
});
window.addEventListener('load',()=>{
	game = new Game();
});
window.addEventListener('keydown',(e)=>{
	game.scene.keys[e.keyCode] = true;
	if(e.keyCode === 82 && !game.scene.you.weapon.reloading){
		game.scene.you.weapon.reloadTime = game.scene.time + game.scene.you.weapon.reloadBase;
		game.scene.you.weapon.reloading = true;
	}
});
window.addEventListener('keyup',(e)=>{
	game.scene.keys[e.keyCode] = false;
});
