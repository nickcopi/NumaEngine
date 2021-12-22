class AstarGrid{
	constructor(gridSize){
		this.gridSize = gridSize;
	}
	initGrid(width,height,obstacles,collide){
		let col = this.gridSize;
		let row = this.gridSize;
		this.unitWidth = width/col;
		this.unitHeight = height/row;
		let unitWidth = this.unitWidth;
		let unitHeight = this.unitHeight;
		let grid = new Array(col);
		for(let i = 0;i < grid.length; i++){
			grid[i] = new Array(row);
		}
		for(let x = 0; x < grid.length; x++){
			for(let y = 0; y < grid[x].length; y++){
				grid[x][y] = new AstarNode(x,y,unitWidth,unitHeight);
				for(let i = 0; i < obstacles.length; i++){
					let fakeNode = {x:x*unitWidth,y:y*unitHeight,width:unitWidth,height:unitHeight};
					if(collide(fakeNode,obstacles[i])){
						grid[x][y].wall = true;
					} 
				}
			}
		}
		for(let x = 0; x < grid.length; x++){
			for(let y = 0; y < grid[x].length; y++){
				grid[x][y].findNeighbors(grid);
			}
		}
		this.grid = grid;

	}
	clear(){
		this.grid.forEach(line=>line.forEach(node=>{
			node.f = 0;
			node.g = undefined;
			node.parent = undefined
		}));
	}
	getPos(x,y){
		return this.grid[Math.floor(x/this.unitWidth)][Math.floor(y/this.unitHeight)];
	}

}
