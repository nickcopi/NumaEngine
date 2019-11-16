class Weapon{
	constructor(speed,spread,spray,flechettes,pierce,fireDelay,damage,radius, capacity, reload,auto){
		this.speed = speed;
		this.spread = spread;
		this.spray = spray
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
		if(this.timeout > game.scene.time || this.reloading)
			return;
		for(let i = -this.spread/2;i<this.spread/2;i+=this.spread/this.flechettes){
			let bullet = new Bullet(you.getCenter().x,you.getCenter().y,this.speed,this.damage,this.pierce,this.radius);
			let randomSpray = Math.random()*this.spray*2 - this.spray;
			bullet.setDirection(you.angle+i+randomSpray);
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