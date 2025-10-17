
var $window = $(window), gardenCtx, gardenCanvas, $garden, garden;
var overlayCtx, overlayCanvas, $overlay, overlayGarden;
var $loveHeart, $content;
var offsetX, offsetY;

function recomputeHeartCenter(){
	offsetX = $loveHeart.width()/2;
	offsetY = $loveHeart.height()/2 - 55;
}

// теперь оверлей равен контенту (накрывает и код, и сердце)
function syncOverlayToContent(){
    var dpr = window.devicePixelRatio || 1;
    var w = $content.innerWidth();   // без margin
    var h = $content.innerHeight();

    // закрепляем к левому верхнему углу content
    $("#overlay").css({ left:0, top:0, width:w+"px", height:h+"px" });

    overlayCanvas.width  = Math.round(w * dpr);
    overlayCanvas.height = Math.round(h * dpr);
    overlayCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

$(function () {
    // setup garden
	$loveHeart = $("#loveHeart");
	$content   = $("#content");
	$garden = $("#garden");
	gardenCanvas = $garden[0];
	var cssW = $("#loveHeart").width();
	var cssH = $("#loveHeart").height();
	gardenCanvas.style.width = cssW + "px";
	gardenCanvas.style.height = cssH + "px";
    gardenCtx = gardenCanvas.getContext("2d");
    (function(){
    	var dpr = window.devicePixelRatio || 1;
    	gardenCanvas.width  = Math.round(cssW * dpr);
    	gardenCanvas.height = Math.round(cssH * dpr);
    	gardenCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    })();
    gardenCtx.globalCompositeOperation = "lighter";
    gardenCtx.lineWidth = 0.8;
    gardenCtx.lineCap = "round";
    garden = new Garden(gardenCtx, gardenCanvas);


	// 2) Проставляем размеры/позицию #content (как у тебя было)
	$("#content").css("width", $loveHeart.width() + $("#code").width());
	$("#content").css("height", Math.max($loveHeart.height(), $("#code").height()));
	$("#content").css("margin-top", Math.max(($window.height() - $("#content").height()) / 2, 10));
	$("#content").css("margin-left", Math.max(($window.width() - $("#content").width()) / 2, 10));

	// 3) Теперь и ТОЛЬКО теперь инициируем overlay и синхроним его к #content
	$overlay = $("#overlay");
	overlayCanvas = $overlay[0];
	overlayCtx = overlayCanvas.getContext("2d");
	overlayCtx.globalCompositeOperation = "lighter";
    overlayCtx.lineWidth = 0.8;
    overlayCtx.lineCap = "round";
	overlayGarden = new Garden(overlayCtx, overlayCanvas);

	recomputeHeartCenter();
	syncOverlayToContent();

    // 4) Рендер-петля
    setInterval(function () {
        garden.render();
        overlayGarden.render();
    }, Garden.options.growSpeed);

	// 5) На случай изменений высоты из-за тайпрайтера — один тик позже пересинхроним
	requestAnimationFrame(syncOverlayToContent);
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
	// пересчитать heart-canvas
	var dpr = window.devicePixelRatio || 1;
	var cssW = $loveHeart.width();
	var cssH = $loveHeart.height();
	gardenCanvas.style.width  = cssW + "px";
	gardenCanvas.style.height = cssH + "px";
	gardenCanvas.width  = Math.round(cssW * dpr);
	gardenCanvas.height = Math.round(cssH * dpr);
	gardenCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

	// пересчитать layout #content (как у тебя было)
	$("#content").css("width", $loveHeart.width() + $("#code").width());
	$("#content").css("height", Math.max($loveHeart.height(), $("#code").height()));
	$("#content").css("margin-top", Math.max(($window.height() - $("#content").height()) / 2, 10));
	$("#content").css("margin-left", Math.max(($window.width() - $("#content").width()) / 2, 10));

	// пересчитать центр и overlay
	recomputeHeartCenter();
	syncOverlayToContent();
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
	var SPIKES = 5;
	var STAR_ROTATE_DEG = 12;

	// базовый размер и позиция берём из loveHeart
	var cssW = $loveHeart.width();
	var cssH = $loveHeart.height();
	var BASE = Math.min(cssW, cssH) || 600;

	var OUTER_R = Math.round(BASE * 0.2);
	var INNER_R = Math.round(OUTER_R * 0.35);
	var STAR_SHIFT_X = Math.round(BASE * (-300 / 600));
	var STAR_SHIFT_Y = Math.round(BASE * (245 / 600));

	// абсолютные координаты центра звезды относительно #content
	var lhPos = $loveHeart.position();
	var cx = lhPos.left + offsetX + STAR_SHIFT_X;
	var cy = lhPos.top  + offsetY + STAR_SHIFT_Y;

	var ROTATE = STAR_ROTATE_DEG * Math.PI / 180;

	if (!getStarPoint._cache ||
	    getStarPoint._cache.rotate !== ROTATE ||
	    getStarPoint._cache.outerR !== OUTER_R ||
	    getStarPoint._cache.innerR !== INNER_R ||
	    getStarPoint._cache.cx !== cx || getStarPoint._cache.cy !== cy) {

		var verts = [];
		var step = Math.PI / SPIKES;
		var a = -Math.PI / 2 + ROTATE;
		for (var i = 0; i < SPIKES * 2; i++) {
			var r = (i % 2 === 0) ? OUTER_R : INNER_R;
			verts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
			a += step;
		}
		verts.push({ x: verts[0].x, y: verts[0].y });

		var segLen = [], cum = [0], total = 0;
		for (var j = 0; j < verts.length - 1; j++) {
			var dx = verts[j + 1].x - verts[j].x;
			var dy = verts[j + 1].y - verts[j].y;
			var d = Math.hypot(dx, dy);
			segLen.push(d);
			total += d;
			cum.push(total);
		}

		getStarPoint._cache = { verts: verts, segLen: segLen, cum: cum, total: total, rotate: ROTATE,
							outerR: OUTER_R, innerR: INNER_R, cx: cx, cy: cy };
	}

	var cache = getStarPoint._cache;
	var verts = cache.verts, segLen = cache.segLen, cum = cache.cum, total = cache.total;

	var t = (angle % (2 * Math.PI)) / (2 * Math.PI);
	var target = t * total;

	var i = 0;
	while (i < segLen.length && cum[i + 1] < target) i++;

	var segStart = cum[i], segDist = segLen[i];
	var k = (segDist === 0) ? 0 : (target - segStart) / segDist;

	var x = verts[i].x + (verts[i + 1].x - verts[i].x) * k;
	var y = verts[i].y + (verts[i + 1].y - verts[i].y) * k;

	return [x, y];
}

function adjustWordsPosition() {
	$('#words').css("position", "absolute");
	$('#words').css("top", $("#garden").position().top + 195);
	$('#words').css("left", $("#garden").position().left + 70);
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
