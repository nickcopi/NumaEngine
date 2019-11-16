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
	constructor(x,y,width,height,wall){
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.h = 0;
		/*this.g = 0; // g is acquired score*/
		this.f = 0;
		this.wall = wall?true:false;
		this.neighbors = [];
	}
	clone(){
		let clone = new AstarNode(this.x,this.y,this.width,this.height);
		clone.wall = this.wall;
		return clone;
	}
	findNeighbors(list,collide){
		list.forEach(node=>{
			if(collide({x:this.x-1,y:this.y,width:this.width,height:this.height},node)){
				if(!this.neighbors.includes(node)) this.neighbors.push(node);
			}
			if(collide({x:this.x,y:this.y-1,width:this.width,height:this.height},node)){
				if(!this.neighbors.includes(node)) this.neighbors.push(node);
			}
			if(collide({x:this.x+1,y:this.y,width:this.width,height:this.height},node)){
				if(!this.neighbors.includes(node)) this.neighbors.push(node);
			}
			if(collide({x:this.x,y:this.y+1,width:this.width,height:this.height},node)){
				if(!this.neighbors.includes(node)) this.neighbors.push(node);
			}
			/*if(collide({x:this.x+1,y:this.y-1,width:this.width,height:this.height},node)){
				if(!this.neighbors.includes(node)) this.neighbors.push(node);
			}
			if(collide({x:this.x+1,y:this.y+1,width:this.width,height:this.height},node)){
				if(!this.neighbors.includes(node)) this.neighbors.push(node);
			}
			if(collide({x:this.x-1,y:this.y-1,width:this.width,height:this.height},node)){
				if(!this.neighbors.includes(node)) this.neighbors.push(node);
			}
			if(collide({x:this.x,y:this.y+1,width:this.width,height:this.height},node)){
				if(!this.neighbors.includes(node)) this.neighbors.push(node);
			}*/
		});
	}
	getArea(){
		return this.width*this.height;
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
		this.spawners = [];
		this.keys = [];
		this.time = 0;
		this.AI_DEBUG = false;
		this.HIT_DEBUG = false;
		this.gridLines = [];
		this.initMap();
		this.tileCutter = new TileCutter(this.width,this.height,this.obstacles);
		this.tileCutter.calcOutlines();
		this.tileCutter.tiles.forEach(tile=>{
			tile.findNeighbors(this.tileCutter.tiles,this.collide);
		});
		this.bg = new Background(0,0,width,height,this.sprites.bg);
		for(let i = 0; i < width/50;i++){
			this.gridLines.push(new Obstacle(i * (width/50),0,1,width));
		}
		for(let i = 0; i < height/50;i++){
			this.gridLines.push(new Obstacle(0,i * (height/50),height,1));
		}
		this.you = new You(youX,youY,this.sprites.you);
		this.interval = setInterval(()=>{
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
			if(enemy.needsPath){
				let tiles = [];
				this.tileCutter.tiles.forEach(tile=>{
					tiles.push(tile.clone());
				});
				tiles.forEach(tile=>{
					tile.findNeighbors(tiles,this.collide);
				});
				enemy.setPath(this.width,this.height,this.obstacles,this.you,this.collide,tiles);
			}
			enemy.setDirection(this.you,this.collide);
			enemy.move(this.obstacles,this.you,this.width,this.height);
		});
		this.spawners.forEach(spawner=>{
			spawner.spawn(this.enemies);
		});
		this.bulletCollide();
		this.handleInput();
		this.checkBounds();
	}
	initMap(){
		this.obstacles.push(new Obstacle(600,20,200,200));
		this.obstacles.push(new Obstacle(100,240,700,50));
		this.enemies.push(new Enemy(0,10,20,20,100,2,20,this.sprites.enemy));
		//this.spawners.push(new Spawner(0,10,600));
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
		return (o1.x < o2.x + o2.width && o1.x + o1.width > o2.x && o1.y < o2.y + o2.height && o1.y + o1.height > o2.y) && o1 !== o2;
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
			ctx.strokeStyle = 'white';
			this.tileCutter.tiles.forEach(line=>{
				let adjusted = this.cameraOffset(line);
				if(adjusted) ctx.strokeRect(adjusted.x,adjusted.y,line.width,line.height);
			});
		}



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

		/*Draw you*/
		this.you.render(ctx,canvas);


		ctx.strokeStyle = 'red';
		this.enemies.forEach(enemy=>{
			let adjusted = this.cameraOffset(enemy);
			if(adjusted){
				enemy.render(ctx,adjusted);
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
			let adjusted = this.cameraOffset(fader);
			fader.render(ctx,adjusted);

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


class Spawner{
	constructor(x,y,speed){
		this.x = x;
		this.y = y;
		this.speed = speed;
		this.time = 0;
	}
	spawn(enemies){
		if(this.time <= game.scene.time){
			enemies.push(new Enemy(this.x,this.y,20,20,100,2,20,game.scene.sprites.enemy));
			this.time = game.scene.time + this.speed;
		}
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
