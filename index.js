let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');


class Game{
	constructor(){
		this.settings = new Settings();
		this.scene = new Scene(canvas.width/2,canvas.height/2,3000,3000,this.settings);
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

class Scene{
	constructor(youX,youY,width,height,settings){
		this.settings = settings;
		this.width = width;
		this.height = height;
		this.bullets = [];
		this.obstacles = [];
		this.enemies = [];
		this.faders = [];
		this.obstacles.push(new Obstacle(20,20,200,200));
		this.obstacles.push(new Obstacle(20,240,700,20));
		this.enemies.push(new Enemy(10,10,20,20));	
		this.keys = [];
		this.time = 0;
		this.you = new You(youX,youY);
		setInterval(()=>{
			this.update();
			this.render();
		},1000/60);
	}
	update(){
		this.time++;
		this.fadeFaders();
		this.you.shoot();
		this.bullets.forEach(bullet=>{
			bullet.move();
		});
		this.enemies.forEach(enemy=>{
			enemy.setDirection(this.you.x,this.you.y);
			enemy.move(this.obstacles);
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

		ctx.fillStyle = 'blue';
		let adjusted = this.cameraOffset({x:0,y:0,width:this.width,height:this.height});
		ctx.fillRect(adjusted.x,adjusted.y,this.width,this.height);

		/*Draw you*/
		ctx.save();
		ctx.translate(canvas.width/2 + (you.width/2),canvas.height/2 + (you.height/2));
		ctx.rotate(you.angle);
		ctx.fillStyle = 'green';
		ctx.fillRect(you.width/-2,you.height/-2,you.width,you.height);
		ctx.restore();

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
		this.enemies.forEach(enemy=>{
			let adjusted = this.cameraOffset(enemy);
			if(adjusted){
				ctx.fillStyle = 'red'; 
				ctx.fillRect(adjusted.x,adjusted.y,enemy.width,enemy.height);
				ctx.fillRect(adjusted.x,adjusted.y + enemy.height + 5,enemy.width,5);
				ctx.fillStyle = 'green';
				ctx.fillRect(adjusted.x,adjusted.y + enemy.height + 5,enemy.width * enemy.hp/enemy.maxHp,5);
			}
		});
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

class Weapon{
	constructor(speed,spread,flechettes,pierce,fireDelay){
		this.speed = speed;
		this.spread = spread;
		this.flechettes = flechettes;
		this.pierce = pierce;
		this.fireDelay = fireDelay;
		this.timeout = 0;
		this.damage = 10;
		this.pierce = 2;
	} 
	shoot(you,x,y){
		if(this.timeout > game.scene.time)
			return;
		for(let i = -this.spread/2;i<this.spread/2;i+=this.spread/this.flechettes){
			let bullet = new Bullet(you.getCenter().x,you.getCenter().y,this.speed,this.damage,this.pierce);
			bullet.setDirection(you.angle,i);
			game.scene.bullets.push(bullet);
		}
		this.timeout = game.scene.time + this.fireDelay;
	}
}

class You{
	constructor(x,y){
		this.x = x;
		this.y = y;
		this.speed = 4;
		this.width = 20;
		this.height = 20;
		this.weapon = new Weapon(15,Math.PI/8,5,2,10);
		this.shooting = false;
		this.angle = 0;
	}
	getCenter(){
		return {
			x: this.x+this.width/2,
			y: this.y+this.height/2
		}
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
	constructor(x,y,width,height){
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.speed = 2;
		this.hp = 100;
		this.maxHp = this.hp;
		this.id = Math.random() * Math.random();
		this.angle = 0;
		this.direction = {};
	}
	setDirection(youX,youY){
		let x = youX- this.x;
		let y = youY - this.y;
		let xPos = x > 0;
		let yPos = y > 0;
		let theta = Math.atan(Math.abs(y)/Math.abs(x));
		if(xPos && !yPos) theta = Math.PI/2 * 3 + (Math.PI/2 - theta);
		if(!xPos && !yPos) theta = Math.PI/2 * 2 + (theta);
		if(!xPos && yPos) theta = Math.PI/2 + (Math.PI/2 - theta);
		this.direction.x = Math.cos(theta);
		this.direction.y = Math.sin(theta);	
		this.angle = theta;
	}
	move(obstacles){
		this.x += this.speed * this.direction.x;
		this.y += this.speed * this.direction.y;
		obstacles.forEach(obstacle=>{
			if(game.scene.collide(obstacle,this)){
				game.scene.backOffCollide(obstacle,this);
			}
		});
	}
}

class Bullet {
	constructor(x,y,speed,damage,pierce){
		this.x = x;
		this.y = y;
		this.width = 5;
		this.height = 5;
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
});
window.addEventListener('keyup',(e)=>{
	game.scene.keys[e.keyCode] = false;
});
