(function () {

    // A cross-browser requestAnimationFrame
    // See https://hacks.mozilla.org/2011/08/animating-with-javascript-from-setinterval-to-requestanimationframe/
    var requestAnimFrame = (function () {
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (callback) {
                window.setTimeout(callback, 1000 / 60);
            };
    })();

    // Create the canvas
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    canvas.width = 512;
    canvas.height = 480;
    document.body.appendChild(canvas);

    // The main game loop
    var lastTime;

    function main() {
        var now = Date.now();
        var dt = (now - lastTime) / 1000.0;

        update(dt);
        render();
        // setTimeout(function() {
        //     console.log(dt)
        // }, 5000);

        lastTime = now;

        if (!pause) requestAnimFrame(main);
    };

    function init() {
        //     terrainPattern = ctx.createPattern(resources.get('img/bg.png'), 'no-repeat');

        document.getElementById('play-again').addEventListener('click', function () {
            reset();
        });

        reset();
        lastTime = Date.now();
        main();
    }

    resources.load([
        'img/mlpSS.png',
        'img/mlpSpriteSheet.png',
        'img/sprites.png'
    ]);

    // Обработчики событий
    document.getElementById('play').addEventListener('click', function () {
        pause = false;
        init();
        document.getElementById('menu').style.display = 'none';
        document.getElementById('game-over-overlay').style.display = 'none';
    });

    document.getElementById('continue').addEventListener('click', function () {
        pause = false;
        document.getElementById('game-over-overlay').style.display = 'none';
        document.getElementById('continue').style.display = "none";
        document.getElementById('menu').style.display = "none";
        lastTime = Date.now();
        main();
    });

    // Объект игрока
    var Pony = 49;
    var hX = 15;
    var lifes = [];

    var player = {
        pos: [0, 0],
        sprite: new Sprite('img/mlpSS.png', [0, Pony], [53, 49], 8, [0, 1, 2, 3, 4])
    };

    for (var i = 1; i <= 3; i++) {
        hX += 23;
        lifes.push({
            pos: [hX, 15],
            sprite: new Sprite('img/mlpSS.png', [0, 172], [18, 19], 3, [0, 1, 2])
        });
    }

    var bullets = [];
    var enemies = [];
    var explosions = [];

    var lastFire = Date.now();
    var gameTime = 0;
    var isGameOver;
    var terrainPattern;
    var pause;

    var score = 0;
    var scoreEl = document.getElementById('score');
    var fpsEl = document.getElementById('fps');

    // Скорость в пикселях в секунду
    var playerSpeed = 200;
    var bulletSpeed = 500;
    var enemySpeed = 100;

    document.getElementById('char').addEventListener('click', function () {
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('charChange').style.display = 'block';
    });

    document.getElementById('back').addEventListener('click', function () {
        document.getElementById('charChange').style.display = 'none';
        document.getElementById('mainMenu').style.display = 'block';
    });

    document.getElementById('c1').addEventListener('click', function () {
        document.getElementById('charChange').style.display = 'none';
        document.getElementById('mainMenu').style.display = 'block';
        Pony = 0;
        player.sprite = new Sprite('img/mlpSS.png', [0, Pony], [53, 49], 8, [0, 1, 2, 3, 4])
    });

    document.getElementById('c2').addEventListener('click', function () {
        document.getElementById('charChange').style.display = 'none';
        document.getElementById('mainMenu').style.display = 'block';
        Pony = 49;
        player.sprite = new Sprite('img/mlpSS.png', [0, Pony], [53, 49], 8, [0, 1, 2, 3, 4])
    });

    // Обновление игровых объектов
    function update(dt) {
        gameTime += dt;

        handleInput(dt);
        updateEntities(dt);

        // console.log('FPS:', 1 / dt)

        if (!isGameOver) {
            if (Math.random() < 1 - Math.pow(.993, gameTime)) {
                var enCol, enFrames = [];
                if (Math.random() > .5) {
                    enCol = 98;
                    enFrames = [0, 1, 2];
                }
                else {
                    enCol = 135;
                    enFrames = [0, 1];
                }
                enemies.push({
                    pos: [canvas.width,
                    Math.random() * (canvas.height - 39)],
                    sprite: new Sprite('img/mlpSS.png', [0, enCol], [35, 37],
                        6, enFrames)
                });
            }

            checkCollisions();
        }

        scoreEl.innerHTML = score;
    };

    function handleInput(dt) {
        if (!isGameOver) {
            if (input.isDown('DOWN') || input.isDown('s')) {
                player.pos[1] += playerSpeed * dt;
            }

            if (input.isDown('UP') || input.isDown('w')) {
                player.pos[1] -= playerSpeed * dt;
            }

            if (input.isDown('LEFT') || input.isDown('a')) {
                player.pos[0] -= playerSpeed * dt;
            }

            if (input.isDown('RIGHT') || input.isDown('d')) {
                player.pos[0] += playerSpeed * dt;
            }
        }

        if (input.isDown('r')) {
            reset();
        }

        if (input.isDown('ESC')) {
            if (document.getElementById('game-over').style.display === 'block') {
                document.getElementById('game-over').style.display = 'none';
            }
            else {
                document.getElementById('continue').style.display = 'block';
            }
            pause = true;
            document.getElementById('menu').style.display = 'block';
            document.getElementById('game-over-overlay').style.display = 'block';
        }

        if (input.isDown('SPACE') &&
            !isGameOver &&
            Date.now() - lastFire > 100) {
            var x = player.pos[0] + player.sprite.size[0] / 2;
            var y = player.pos[1] + player.sprite.size[1] / 2;

            bullets.push({
                pos: [x, y],
                dir: 'forward',
                sprite: new Sprite('img/mlpSS.png', [105, 98], [39, 17], 5, [0, 1, 2])
            });
            bullets.push({
                pos: [x, y],
                dir: 'up',
                sprite: new Sprite('img/sprites.png', [0, 50], [9, 5])
            });
            bullets.push({
                pos: [x, y],
                dir: 'down',
                sprite: new Sprite('img/sprites.png', [0, 60], [9, 5])
            });

            lastFire = Date.now();
        }
    }

    function updateEntities(dt) {
        // Update the player sprite animation
        player.sprite.update(dt);

        for (var i = 0; i < lifes.length; i++)
            lifes[i].sprite.update(dt);

        // Update all the bullets
        for (var i = 0; i < bullets.length; i++) {
            var bullet = bullets[i];

            switch (bullet.dir) {
                case 'up': bullet.pos[1] -= bulletSpeed * dt; break;
                case 'down': bullet.pos[1] += bulletSpeed * dt; break;
                default:
                    bullets[i].sprite.update(dt);
                    bullet.pos[0] += bulletSpeed * dt;
            }

            // Remove the bullet if it goes offscreen
            if (bullet.pos[1] < 0 || bullet.pos[1] > canvas.height ||
                bullet.pos[0] > canvas.width) {
                bullets.splice(i, 1);
                i--;
            }
        }

        // Update all the enemies
        for (var i = 0; i < enemies.length; i++) {
            enemies[i].pos[0] -= enemySpeed * dt;
            enemies[i].sprite.update(dt);

            // Remove if offscreen
            if (enemies[i].pos[0] + enemies[i].sprite.size[0] < 0) {
                enemies.splice(i, 1);
                i--;
            }
        }

        // Update all the explosions
        for (var i = 0; i < explosions.length; i++) {
            explosions[i].sprite.update(dt);

            // Remove if animation is done
            if (explosions[i].sprite.done) {
                explosions.splice(i, 1);
                i--;
            }
        }
    }

    // Collisions

    function collides(x, y, r, b, x2, y2, r2, b2) {
        return !(r <= x2 || x > r2 ||
            b <= y2 || y > b2);
    }

    function boxCollides(pos, size, pos2, size2) {
        return collides(pos[0], pos[1],
            pos[0] + size[0], pos[1] + size[1],
            pos2[0], pos2[1],
            pos2[0] + size2[0], pos2[1] + size2[1]);
    }

    function checkCollisions() {
        checkPlayerBounds();

        // Run collision detection for all enemies and bullets
        for (var i = 0; i < enemies.length; i++) {
            var pos = enemies[i].pos;
            var size = enemies[i].sprite.size;

            for (var j = 0; j < bullets.length; j++) {
                var pos2 = bullets[j].pos;
                var size2 = bullets[j].sprite.size;

                if (boxCollides(pos, size, pos2, size2)) {
                    // Remove the enemy
                    enemies.splice(i, 1);
                    i--;

                    // Add score
                    score += 10;

                    // Add an explosion
                    explosions.push({
                        pos: pos,
                        sprite: new Sprite('img/sprites.png',
                            [0, 117],
                            [39, 39],
                            16,
                            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                            null,
                            true)
                    });

                    // Remove the bullet and stop this iteration
                    bullets.splice(j, 1);
                    break;
                }
            }

            if (boxCollides(pos, size, player.pos, player.sprite.size)) {

                enemies.splice(i, 1);

                explosions.push({
                    pos: pos,
                    sprite: new Sprite('img/sprites.png',
                        [0, 117],
                        [39, 39],
                        16,
                        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                        null,
                        true)
                });

                setTimeout(function () {
                    explosions = [];
                }, 1000);


                lifes.splice(lifes.length - 1, 1);

                if (lifes.length == 0) {
                    gameOver();
                    explosions.push({
                        pos: player.pos,
                        sprite: new Sprite('img/sprites.png',
                            [0, 117],
                            [39, 39],
                            16,
                            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                            null,
                            true)
                    });

                }
            }
        }
    }

    function checkPlayerBounds() {
        // Check bounds
        if (player.pos[0] < 0) {
            player.pos[0] = 0;
        }
        else if (player.pos[0] > canvas.width - player.sprite.size[0]) {
            player.pos[0] = canvas.width - player.sprite.size[0];
        }

        if (player.pos[1] < 0) {
            player.pos[1] = 0;
        }
        else if (player.pos[1] > canvas.height - player.sprite.size[1]) {
            player.pos[1] = canvas.height - player.sprite.size[1];
        }
    }

    // Draw everything
    function render() {

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Render the player if the game isn't over
        if (!isGameOver) {
            renderEntity(player);
            renderEntities(enemies);
        }

        renderEntities(lifes);
        renderEntities(bullets);
        renderEntities(explosions);
    };

    function renderEntities(list) {
        for (var i = 0; i < list.length; i++) {
            renderEntity(list[i]);
        }
    }

    function renderEntity(entity) {
        ctx.save();
        ctx.translate(entity.pos[0], entity.pos[1]);
        entity.sprite.render(ctx);
        ctx.restore();
    }

    // Game over
    function gameOver() {
        document.getElementById('game-over').style.display = 'block';
        document.getElementById('game-over-overlay').style.display = 'block';
        isGameOver = true;
        enemies = [];
    }

    // Restart
    function reset() {
        document.getElementById('game-over').style.display = 'none';
        document.getElementById('game-over-overlay').style.display = 'none';
        isGameOver = false;
        gameTime = 0;
        score = 0;

        enemies = [];
        bullets = [];
        lifes = [];
        hX = 15;

        for (var i = 1; i <= 3; i++) {
            hX += 23;
            lifes.push({
                pos: [hX, 15],
                sprite: new Sprite('img/mlpSS.png', [0, 172], [18, 19], 3, [0, 1, 2])
            });
        }

        player.pos = [50, canvas.height / 2];
    };

})()