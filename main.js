function setup() {
    createCanvas(windowWidth, windowHeight);
    msg = new MSG("VJP");
}
  
function draw() {
    document.getElementById("speedCounter").innerHTML = document.getElementById("speed").value;
    background(255);
    drawMSG(msg);
}
  
function drawMSG(msg) {
    msg.speed = document.getElementById("speed").value;
    msg.draw();
    msg.bounce();
    msg.move();
}
  
function MSG(msg) {
    this.size = windowWidth / 10;
    this.x = random(this.size, windowWidth - this.size * 2);
    this.y = random(this.size, windowHeight - windowHeight / 5);
    this.speed = 10;
    this.xvel = random([-1, 1]);
    this.yvel = random([-1, 1]);
    this.msg = msg;
    this.xscl = msg.length * this.size * 0.625;
    this.yscl = windowHeight / 10;
    
    this.draw = function() {
      textSize(this.size);
      text(this.msg, this.x, this.y);
    };
  
    this.move = function() {
      this.x += this.xvel * this.speed;
      this.y += this.yvel * this.speed;
    };
    
    this.bounce = function() {
      let lower_bound = this.y + this.yscl > windowHeight && this.yvel > 0;
      let upper_bound = this.y < windowHeight / 10 && this.yvel < 0;
      let right_bound = this.x + this.xscl > windowWidth && this.xvel > 0;
      let left_bound = this.x < 0 && this.xvel < 0;
      if (lower_bound || upper_bound) {
        this.yvel *= -1;
      }
      if (right_bound || left_bound) {
        this.xvel *= -1
      }
    };
  }
