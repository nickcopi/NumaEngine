class Weapon {
	constructor(weaponData) {
		this.speed = weaponData.speed;
		this.spread = weaponData.spread;
		this.spray = weaponData.spray
		this.flechettes = weaponData.flechettes;
		this.pierce = weaponData.pierce;
		this.fireDelay = weaponData.fireDelay;
		this.damage = weaponData.damage;
		this.radius = weaponData.radius;
		this.timeout = 0;
		this.capacity = weaponData.capacity;
		this.reloadBase = weaponData.reload;
		this.range = weaponData.range;
		this.auto = weaponData.auto;
		this.mag = this.capacity;
		this.reloading = false;
	}
	shoot(you, x, y) {
		if (this.timeout > game.scene.time || this.reloading)
			return;
		for (let i = -this.spread / 2; i < this.spread / 2; i += this.spread / this.flechettes) {
			let bullet = new Bullet(you.getCenter().x, you.getCenter().y, this.speed, this.damage, this.pierce, this.radius, this.range);
			let randomSpray = Math.random() * this.spray * 2 - this.spray;
			bullet.setDirection(you.angle + i + randomSpray);
			game.scene.bullets.push(bullet);
		}
		this.mag--;
		if (this.mag === 0) {
			this.reloadTime = game.scene.time + this.reloadBase;
			this.reloading = true;
		}
		this.timeout = game.scene.time + this.fireDelay;
	}
	reload() {
		if (this.reloadTime <= game.scene.time) {
			this.mag = this.capacity;
			this.reloading = false;
		}
	}
}