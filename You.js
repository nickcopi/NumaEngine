class You extends Obstacle{
	constructor(x,y,img){
		super(x,y,20,20);
		this.speed = 4;
		this.weapon = new Weapon(15,Math.PI/8,Math.PI/32,8,2,10,5,2,5,30,true);
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
    render(ctx,canvas){
        ctx.save();
		ctx.translate(canvas.width/2 + (this.width/2),canvas.height/2 + (this.height/2));
		ctx.rotate(this.angle);
		ctx.drawImage(this.img, this.width/-2,this.height/-2,this.width,this.height);
		ctx.restore();
		ctx.fillStyle = 'red';
		ctx.fillRect(canvas.width/2,canvas.height/2 + this.height + 5, this.width,5);
		ctx.fillStyle = 'green';
		ctx.fillRect(canvas.width/2,canvas.height/2 + this.height + 5, this.width * this.hp/this.maxHp,5);

    }
}
