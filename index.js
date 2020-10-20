const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');
const scoreEl = document.querySelector('#score');
const gameBtn = document.querySelector('#start-btn');
const modelEl = document.querySelector('#modelEl');
const eg_score = document.querySelector('#end-game-score');

canvas.width = innerWidth;
canvas.height = innerHeight;

class Player {
    constructor(x, y, r, col){
        this.x = x;
        this.y = y;
        this.radius = r;
        this.color = col;
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill()
    }
}

class Projectile {
    constructor(x, y, r, col, v){
        this.x = x;
        this.y = y;
        this.radius = r;
        this.color = col;
        this.velocity = v;
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill()
    }

    update() {
        this.draw();
        this.x = this.x + this.velocity.x * 5;
        this.y = this.y + this.velocity.y * 5;
    }
}

class Enemy {
    constructor(x, y, r, col, v){
        this.x = x;
        this.y = y;
        this.radius = r;
        this.color = col;
        this.velocity = v;
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill()
    }

    update() {
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}

const friction = 0.98;
class Particle {
    constructor(x, y, r, col, v){
        this.x = x;
        this.y = y;
        this.radius = r;
        this.color = col;
        this.velocity = v;
        this.alpha = 1;
    }

    draw() {
        c.save();
        c.globalAlpha = this.alpha;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
        c.restore();
    }

    update() {
        this.draw();
        this.velocity.x = this.velocity.x * friction;
        this.velocity.y = this.velocity.y * friction;
        this.x = this.x + this.velocity.x * 5;
        this.y = this.y + this.velocity.y * 5;
        this.alpha -= 0.01;
    }
}
const player_x = canvas.width / 2;
const player_y = canvas.height / 2;
const player_r = (canvas.width * 0.005) * 10;

let player = new Player(player_x, player_y, player_r, 'white');
let projectiles = [];
let enemies = [];
let particles = [];
let score = 0;

function init() {
    player = new Player(player_x, player_y, player_r, 'white');
    projectiles = [];
    enemies = [];
    particles = [];
    score = 0;
    scoreEl.innerHTML = score;
}

let e_int;
function spawnEnemies() {
    e_int = setInterval(()=>{
        let x;
        let y;
        const r = Math.random() * (((canvas.width * 0.02) - (canvas.width * 0.005)))+(canvas.width * 0.02);
        if(Math.random() > 0.5){
            x = Math.random() > 0.5 ? 0 - r : canvas.width+r;
            y = Math.random() * canvas.height;
        } else {
            y = Math.random() > 0.5 ? 0 - r : canvas.height+r;
            x = Math.random() * canvas.width;
        }
        const col = `hsl(${Math.random() * 360}, 50%, 50%)`;
        
        const angle = Math.atan2(
            player_y-y,
            player_x-x
        );
        const v = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        }

        enemies.push(new Enemy(x,y,r,col,v))
    }, 2000);
}

let animationID;
function animate() {
    animationID = requestAnimationFrame(animate);
    c.fillStyle = 'rgba(0,0,0,0.15)'
    c.fillRect(0, 0, canvas.width, canvas.height);
    player.draw();
    particles.forEach((p,i)=>{
        p.update();
        if(p.alpha <= 0){
            particles.splice(i,1);
        }
    })
    projectiles.forEach((p,i)=>{
        p.update();
        // remove off screen projectiles
        if(p.x+p.radius<0 ||
            p.x-p.radius>canvas.width ||
            p.y + p.radius < 0 ||
            p.y - p.radius > canvas.height){
                projectiles.splice(i,1);
            }
    })
    enemies.forEach((e,i)=>{
        e.update();

        const p_dist = Math.hypot(player_x - e.x, player_y - e.y);
        //player-e collision
        if(p_dist < e.radius + player_r){
            // end game
            clearInterval(e_int);
            cancelAnimationFrame(animationID);
            eg_score.innerHTML = score;
            modelEl.style.display = 'flex';
        }

        // e-p collision
        projectiles.forEach((p, pi)=>{
            const dist = Math.hypot(p.x - e.x, p.y - e.y);
            // projectile creation
            if (dist < e.radius + p.radius + 1){

                // increase score
                score += 10;
                scoreEl.innerHTML = score;

                // create collision particle effect
                for (let index = 0; index < (Math.random() * 8) + e.radius/10; index++) {
                    particles.push(new Particle(p.x,p.y,Math.random() * 2,e.color,{x: (Math.random() - 0.5) * 6,y: (Math.random() - 0.5)*6}))
                }

                // shrinking
                if (e.radius - 10 > 10){
                    gsap.to(e,{
                        radius: e.radius - 10,
                    })
                    e.radius -= 10;
                    setTimeout(()=>{
                        projectiles.splice(pi,1);
                    },0)
                } else {
                    setTimeout(()=>{
                        enemies.splice(i,1);
                        projectiles.splice(pi,1);
                    },0)
                }
            }
        })
    })
}

addEventListener('click', (e) => {
    const angle = Math.atan2(
        e.clientY-player_y,
        e.clientX-player_x
    );
    const v = {
        x: Math.cos(angle),
        y: Math.sin(angle)
    }
    projectiles.push(new Projectile(
        player_x,
        player_y,
        player_r/10,
        'white',
        v
    ));
});

gameBtn.addEventListener('click', () => {
    init()
    animate();
    spawnEnemies();
    modelEl.style.display = 'none';
})
