
var $window = $(window), gardenCtx, gardenCanvas, $garden, garden;
var overlayCtx, overlayCanvas, $overlay, overlayGarden;
var clientWidth = $(window).width();
var clientHeight = $(window).height();

$(function () {
    // setup garden
	$loveHeart = $("#loveHeart");
	var offsetX = $loveHeart.width() / 2;
	var offsetY = $loveHeart.height() / 2 - 55;
    $garden = $("#garden");
    gardenCanvas = $garden[0];
	var cssW = $("#loveHeart").width();
	var cssH = $("#loveHeart").height();
	gardenCanvas.style.width = cssW + "px";
	gardenCanvas.style.height = cssH + "px";
    gardenCtx = gardenCanvas.getContext("2d");
    // HiDPI scaling for crisper strokes
    (function(){
    	var dpr = window.devicePixelRatio || 1;
    	gardenCanvas.width = Math.round(cssW * dpr);
    	gardenCanvas.height = Math.round(cssH * dpr);
    	gardenCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    })();
    gardenCtx.globalCompositeOperation = "lighter";
    gardenCtx.lineWidth = 0.8;
    gardenCtx.lineCap = "round";
    garden = new Garden(gardenCtx, gardenCanvas);

	// setup overlay for star above text
	$overlay = $("#overlay");
	overlayCanvas = $overlay[0];
	overlayCanvas.style.width = cssW + "px";
	overlayCanvas.style.height = cssH + "px";
	overlayCtx = overlayCanvas.getContext("2d");
    // HiDPI scaling for overlay
    (function(){
    	var dpr = window.devicePixelRatio || 1;
    	overlayCanvas.width = Math.round(cssW * dpr);
    	overlayCanvas.height = Math.round(cssH * dpr);
    	overlayCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    })();
	overlayCtx.globalCompositeOperation = "lighter";
    overlayCtx.lineWidth = 0.8;
    overlayCtx.lineCap = "round";
	overlayGarden = new Garden(overlayCtx, overlayCanvas);
	
	$("#content").css("width", $loveHeart.width() + $("#code").width());
	$("#content").css("height", Math.max($loveHeart.height(), $("#code").height()));
	$("#content").css("margin-top", Math.max(($window.height() - $("#content").height()) / 2, 10));
	$("#content").css("margin-left", Math.max(($window.width() - $("#content").width()) / 2, 10));

    // renderLoop
    setInterval(function () {
        garden.render();
        overlayGarden.render();
    }, Garden.options.growSpeed);
});

// Heart click -> show GIF modal (delegated to support typewriter-dynamic content)
(function(){
	function showModal() {
		var modal = document.getElementById('gifModal');
		if (!modal) return;
		modal.classList.add('show');
		modal.setAttribute('aria-hidden','false');
		var audio = document.getElementById('meowAudio');
		if (audio) {
			try {
				audio.pause();
				audio.currentTime = 0;
				audio.loop = true;
				audio.volume = 1.0;
				audio.play();
			} catch (e) {}
		}
	}
	function hideModal() {
		var modal = document.getElementById('gifModal');
		if (!modal) return;
		modal.classList.remove('show');
		modal.setAttribute('aria-hidden','true');
		var audio = document.getElementById('meowAudio');
		if (audio) {
			try {
				audio.pause();
				audio.currentTime = 0;
			} catch (e) {}
		}
	}
	document.addEventListener('click', function(e){
		var link = e.target && (e.target.id === 'heartLink' ? e.target : e.target.closest && e.target.closest('#heartLink'));
		if (link) {
			e.preventDefault();
			showModal();
			return;
		}
		var closeBtn = e.target && (e.target.id === 'gifClose' ? e.target : e.target.closest && e.target.closest('#gifClose'));
		if (closeBtn) {
			hideModal();
			return;
		}
		var modal = document.getElementById('gifModal');
		if (modal && e.target === modal) {
			hideModal();
		}
	});
	document.addEventListener('keydown', function(e){
		if (e.key === 'Escape') hideModal();
	});
})();

$(window).resize(function() {
    var newWidth = $(window).width();
    var newHeight = $(window).height();
    if (newWidth != clientWidth && newHeight != clientHeight) {
        // Обновляем размеры
        clientWidth = newWidth;
        clientHeight = newHeight;
        
        // Пересчитываем позиции элементов
        adjustCodePosition();
        adjustWordsPosition();
        
        // Очищаем кеш звезды для пересчета
        if (getStarPoint._cache) {
            getStarPoint._cache = null;
        }
        
        // Перерисовываем канвасы
        if (gardenCtx && overlayCtx) {
            gardenCtx.clearRect(0, 0, gardenCanvas.width, gardenCanvas.height);
            overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        }
    }
});

function getHeartPoint(angle) {
	var t = angle / Math.PI;
	var x = 19.5 * (16 * Math.pow(Math.sin(t), 3));
	var y = - 20 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
	return new Array(offsetX + x, offsetY + y);
}

function startHeartAnimation() {
	var interval = 50;
	var angle = 10;
	var heart = new Array();
	var animationTimer = setInterval(function () {
		var bloom = getHeartPoint(angle);
		var draw = true;
		for (var i = 0; i < heart.length; i++) {
			var p = heart[i];
			var distance = Math.sqrt(Math.pow(p[0] - bloom[0], 2) + Math.pow(p[1] - bloom[1], 2));
			if (distance < Garden.options.bloomRadius.max * 1.3) {
				draw = false;
				break;
			}
		}
		if (draw) {
			heart.push(bloom);
			garden.createRandomBloom(bloom[0], bloom[1]);
		}
		if (angle >= 30) {
			clearInterval(animationTimer);
			showMessages();
		} else {
			angle += 0.2;
		}
	}, interval);
}

(function($) {
	$.fn.typewriter = function() {
		this.each(function() {
			var $ele = $(this), str = $ele.html(), progress = 0;
			$ele.html('');
			var timer = setInterval(function() {
				var current = str.substr(progress, 1);
				if (current == '<') {
					progress = str.indexOf('>', progress) + 1;
				} else {
					progress++;
				}
				$ele.html(str.substring(0, progress) + (progress & 1 ? '_' : ''));
				if (progress >= str.length) {
					clearInterval(timer);
				}
			}, 75);
		});
		return this;
	};
})(jQuery);


function showMessages() {
	adjustWordsPosition();
	$('#messages').fadeIn(5000, function() {
		showLoveU();
	});
}
function getStarPoint(angle) {
	// === Адаптивная звезда: масштабируется под размер экрана ===
	var SPIKES = 5;
	var STAR_ROTATE_DEG = 12; // угол поворота звезды (в градусах)
	
	// Получаем размеры экрана и канваса
	var screenWidth = $(window).width();
	var screenHeight = $(window).height();
	var cssW = overlayCanvas ? overlayCanvas.clientWidth : ($('#overlay').length ? $('#overlay').width() : 600);
	var cssH = overlayCanvas ? overlayCanvas.clientHeight : ($('#overlay').length ? $('#overlay').height() : 600);
	
	// Базовый размер для масштабирования (ваш текущий экран 1366x768)
	var baseScreenWidth = 1366;
	var baseScreenHeight = 768;
	
	// Коэффициент масштабирования относительно вашего экрана
	var scaleX = screenWidth / baseScreenWidth;
	var scaleY = screenHeight / baseScreenHeight;
	var scale = Math.min(scaleX, scaleY, 1); // не увеличиваем больше оригинала
	
	// Базовые размеры звезды (как на вашем экране)
	var baseOuterR = 120; // базовый внешний радиус
	var baseInnerR = 42;  // базовый внутренний радиус
	var baseShiftX = 100; // базовый сдвиг по X
	var baseShiftY = 245; // базовый сдвиг по Y
	
	// Применяем масштабирование
	var OUTER_R = Math.round(baseOuterR * scale);
	var INNER_R = Math.round(baseInnerR * scale);
	var STAR_SHIFT_X = Math.round(baseShiftX * scale);
	var STAR_SHIFT_Y = Math.round(baseShiftY * scale);

	// --- ленивый кеш: вершины и длины считаем один раз ---
	var ROTATE = STAR_ROTATE_DEG * Math.PI / 180;
	if (!getStarPoint._cache || getStarPoint._cache.rotate !== ROTATE || getStarPoint._cache.outerR !== OUTER_R || getStarPoint._cache.innerR !== INNER_R || getStarPoint._cache.shiftX !== STAR_SHIFT_X || getStarPoint._cache.shiftY !== STAR_SHIFT_Y) {
		// центр звезды: от центра overlayCanvas в CSS-пикселях, с тем же вертикальным смещением, что у сердца
		var cx = (overlayCanvas ? cssW / 2 : offsetX) + STAR_SHIFT_X;
		var cy = (overlayCanvas ? (cssH / 2 - 55) : offsetY) + STAR_SHIFT_Y;

		// набираем массив вершин по окружности, начиная сверху
		var verts = [];
		var step = Math.PI / SPIKES;
		var a = -Math.PI / 2 + ROTATE;
		for (var i = 0; i < SPIKES * 2; i++) {
			var r = (i % 2 === 0) ? OUTER_R : INNER_R;
			verts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
			a += step;
		}
		// замкнуть контур
		verts.push({ x: verts[0].x, y: verts[0].y });

		// посчитать длины сегментов и кумулятив
		var segLen = [], cum = [0], total = 0;
		for (var j = 0; j < verts.length - 1; j++) {
			var dx = verts[j + 1].x - verts[j].x;
			var dy = verts[j + 1].y - verts[j].y;
			var d = Math.hypot(dx, dy);
			segLen.push(d);
			total += d;
			cum.push(total);
		}

		getStarPoint._cache = { verts: verts, segLen: segLen, cum: cum, total: total, rotate: ROTATE, outerR: OUTER_R, innerR: INNER_R, shiftX: STAR_SHIFT_X, shiftY: STAR_SHIFT_Y };
	}

	var cache = getStarPoint._cache;
	var verts = cache.verts, segLen = cache.segLen, cum = cache.cum, total = cache.total;

	// angle (0..2π) -> доля пути вдоль контура
	var t = (angle % (2 * Math.PI)) / (2 * Math.PI);
	var target = t * total;

	// найти сегмент, на котором лежит target
	var i = 0;
	while (i < segLen.length && cum[i + 1] < target) i++;

	// интерполяция внутри сегмента
	var segStart = cum[i], segDist = segLen[i];
	var k = (segDist === 0) ? 0 : (target - segStart) / segDist;

	var x = verts[i].x + (verts[i + 1].x - verts[i].x) * k;
	var y = verts[i].y + (verts[i + 1].y - verts[i].y) * k;

	return [x, y];
}

function adjustWordsPosition() {
	$('#words').css("position", "absolute");
	
	// Адаптивные позиции в зависимости от размера экрана
	var screenWidth = $(window).width();
	var screenHeight = $(window).height();
	
	// Базовые позиции для экрана 1366x768
	var baseTop = 195;
	var baseLeft = 70;
	
	// Масштабируем позиции
	var scale = Math.min(screenWidth / 1366, screenHeight / 768, 1);
	var topOffset = Math.round(baseTop * scale);
	var leftOffset = Math.round(baseLeft * scale);
	
	$('#words').css("top", $("#garden").position().top + topOffset);
	$('#words').css("left", $("#garden").position().left + leftOffset);
}

function adjustCodePosition() {
	$('#code').css("margin-top", ($("#garden").height() - $("#code").height()) / 2);
}


function showLoveU() {
	$('#bday').fadeIn(3000);
}
function startStarAnimation() {
	var interval = 60; // 50–70 норм
	var angle = 0;
	var placed = [];

	var timer = setInterval(function () {
		var bloom = getStarPoint(angle);
		var draw = true;

		// не давать цветочкам слипаться
		for (var i = 0; i < placed.length; i++) {
			var p = placed[i];
			var dx = p[0] - bloom[0], dy = p[1] - bloom[1];
			if (Math.sqrt(dx*dx + dy*dy) < Garden.options.bloomRadius.max * 1.3) {
				draw = false; break;
			}
		}

		if (draw) {
			placed.push(bloom);

			var oldColor = Garden.options.color;
			var oldBloomRadius = Garden.options.bloomRadius;
			Garden.options.color = {
				rmin: 235, rmax: 255,
				gmin: 185, gmax: 215,
				bmin: 0,  bmax: 40,
				opacity: 0.65
			};
			Garden.options.bloomRadius = { min: 4, max: 6 }; // лепестки звезды компактнее
			overlayGarden.createRandomBloom(bloom[0], bloom[1]);
			Garden.options.bloomRadius = oldBloomRadius;
			Garden.options.color = oldColor;
		}

		// идём равномерно по контуру
		angle += 0.06; // шаг по пути; больше = быстрее обрисовка
		// дойдём чуть дальше 2π, чтобы гарантировать прорисовку последней вершины
		if (angle >= 2 * Math.PI + 0.02) {
			clearInterval(timer);
		}
	}, interval);
}
