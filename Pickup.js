class Pickup{
    constructor(x,y,width,height){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    render(ctx,adjusted){
        ctx.fillStyle = ''
        ctx.fillRect(adjusted.x,adjusted.y,this.width,this.height);
    }
    use(player){
        player.hp += 10;
    }
}