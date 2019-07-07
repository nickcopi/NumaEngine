class TileCutter{
		constructor(width,height,obstacles){
			this.rects = obstacles;
			this.outlines = [];
			this.tiles = [];
			this.width = width;
			this.height = height;
		}
		calcOutlines(){
			this.tiles = [];
			this.rects.forEach(o=>{
				this.tiles.push(new AstarNode(o.x,o.y,o.width,o.height,true));
			});
			while(true){
				this.outlines = [];
				this.tiles.forEach(rect=>{
					this.testPoint(rect.x,rect.y);
					this.testPoint(rect.x,rect.y+rect.height);
					this.testPoint(rect.x+rect.width,rect.y);
					this.testPoint(rect.x+rect.width,rect.y + rect.height);
				});
				this.cornerCalc();
				let max = new AstarNode(0,0,0,0);
				this.outlines.forEach(outline=>{
					if(outline.getArea() > max.getArea())
						max = outline
				});

				if(max.getArea() === 0){
					return;
				}
				this.tiles.push(max);
			}
		}
		cornerCalc(){
			//let testPoint = this.testPoint;
			this.testPoint(0,0);
			this.testPoint(0,this.height);
			this.testPoint(this.width,0);
			this.testPoint(this.width,this.height);
		}

		testPoint(x,y){
			let top = new AstarNode(x,y,0,0);
			let looping = true;
			let collide = this.collide;
			let outlines = this.outlines;
			let tiles = this.tiles;
			while(top.x >= 0 && looping){
				top.x--;
				top.width++;
				tiles.forEach(rect=>{
					if(collide(top,rect)){
						looping = false;
					}
				});
			}
			top.width--;
			top.x++;
			looping = true;
			while(top.y >= 0 && looping){
				top.y--;
				top.height++;
				tiles.forEach(rect=>{
					if(collide(top,rect)){
						looping = false;
					}
				});
			}
			top.height--;
			top.y++;		
			looping = true;
			let bottom = new AstarNode(x,y,0,0);
			while(bottom.x >= 0 && looping){
				bottom.x--;
				bottom.width++;
				tiles.forEach(rect=>{
					if(collide(bottom,rect)){
						looping = false;
					}
				});
			}
			bottom.width--;
			bottom.x++;
			looping = true;
			while(bottom.y+bottom.height <= this.height && looping){
				bottom.height++;
				tiles.forEach(rect=>{
					if(collide(bottom,rect)){
						looping = false;
					}
				});
			}
			bottom.height--;
			looping = true;
			let right = new AstarNode(x,y,0,0);
			while(right.x+right.width <= this.width && looping){
				right.width++;
				tiles.forEach(rect=>{
					if(collide(right,rect)){
						looping = false;
					}
				});
			}
			right.width--;
			looping = true;
			while(right.y+right.height <= this.height && looping){
				right.height++;
				tiles.forEach(rect=>{
					if(collide(right,rect)){
						looping = false;
					}
				});
			}
			right.height--;
			looping = true;
			let temp = new AstarNode(x,y,0,0);
			while(temp.x+temp.width <= this.width && looping){
				temp.width++;
				tiles.forEach(rect=>{
					if(collide(temp,rect)){
						looping = false;
					}
				});
			}
			temp.width--;
			looping = true;
			while(temp.y >= 0 && looping){
				temp.y--;
				temp.height++;
				tiles.forEach(rect=>{
					if(collide(temp,rect)){
						looping = false;
					}
				});
			}
			temp.y++;
			temp.height--;
			looping = true;
			if(top.width > 1 && top.height > 1) outlines.push(top);
			if(bottom.width > 1 && bottom.height > 1) outlines.push(bottom);
			if(right.width > 1 && right.height > 1) outlines.push(right);
			if(temp.width > 1 && temp.height > 1) outlines.push(temp);
		}
		collide(o1,o2){
			return (o1.x < o2.x + o2.width && o1.x + o1.width > o2.x && o1.y < o2.y + o2.height && o1.y + o1.height > o2.y) && o1 !== o2;
		}
	}