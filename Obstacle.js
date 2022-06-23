class Obstacle{
	constructor(x,y,width,height){
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}
	getCenterX(){
		return this.x + this.width/2;
	}
	getCenterY(){
		return this.y + this.height/2;
	}
    render(ctx, adjusted){
        ctx.fillRect(adjusted.x,adjusted.y,this.width,this.height);
    }
}