
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
    render(ctx,adjusted){
        ctx.globalAlpha = this.opacity;
        if(adjusted) ctx.fillText(this.text,adjusted.x,adjusted.y+10);
    }
}
