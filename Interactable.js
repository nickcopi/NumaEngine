class Interactable {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.interactCooldown = 60;
        this.lastInteract = -this.interactCooldown;
    }
    interact(time) {
        if (this.lastInteract + this.interactCooldown > time) return;
        console.log("Interactable.interact() not implemented");
        this.lastInteract = time;
    }
    render(ctx, adjusted) {
        ctx.fillRect(adjusted.x, adjusted.y, this.width, this.height);
    }
}