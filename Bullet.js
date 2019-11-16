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
	setDirection(theta){
		this.direction.x = Math.cos(theta);
		this.direction.y = Math.sin(theta);	
		this.angle = theta;
	}
	move(){
		this.x += this.speed * this.direction.x;
		this.y += this.speed * this.direction.y;
	}

}