class Bullet {
	constructor(x, y, speed, damage, pierce, radius, maxRange) {
		this.x = x;
		this.y = y;
		this.width = radius;
		this.height = radius;
		this.speed = speed;
		this.damage = damage;
		this.pierce = pierce;
		this.maxRange = maxRange;
		this.rangeUsed = 0;
		this.hits = [];
		this.angle = 0;
		this.direction = {};
	}
	setDirection(theta) {
		this.direction.x = Math.cos(theta);
		this.direction.y = Math.sin(theta);
		this.angle = theta;
	}
	move() {
		this.x += this.speed * this.direction.x;
		this.y += this.speed * this.direction.y;
		this.rangeUsed += Math.abs(this.speed * this.direction.x) + Math.abs(this.speed * this.direction.y);
		return this.rangeUsed <= this.maxRange;
	}

}