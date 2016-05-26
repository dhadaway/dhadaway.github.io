// nav
$('.nav__trigger').on('click', function(e){
     e.preventDefault();
     $(this).parent().toggleClass('nav--active');
   });

// gallery
'use strict';

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Emitter = function () {
    function Emitter() {
        _classCallCheck(this, Emitter);

        this._events = {};
    }

    Emitter.prototype._hasEvent = function _hasEvent(eventName) {
        return this._events.hasOwnProperty(eventName);
    };

    Emitter.prototype.on = function on(eventName, callback) {
        this._events[eventName] = this._events[eventName] || [];

        this._events[eventName].push(callback);
    };

    Emitter.prototype.off = function off(eventName, callback) {
        if (!this._hasEvent(eventName)) {
            return;
        }

        var index = this._events[eventName].indexOf(callback);

        if (index > -1) {
            this._events[eventName].splice(index, 1);
        }
    };

    Emitter.prototype.trigger = function trigger(eventName, data) {
        if (this._events.hasOwnProperty(eventName)) {
            this._events[eventName].forEach(function (callback) {
                if (typeof data !== 'undefined') {
                    callback(data);
                } else {
                    callback();
                }
            });
        }
    };

    Emitter.prototype.destroy = function destroy() {
        this._events = null;
    };

    return Emitter;
}();

;

var Gallery = function (_Emitter) {
    _inherits(Gallery, _Emitter);

    function Gallery(el) {
        _classCallCheck(this, Gallery);

        var _this = _possibleConstructorReturn(this, _Emitter.call(this));

        _this._el = el;
        _this._width = _this._el.getBoundingClientRect().width;
        _this._maxHeight = 500;
        _this._margin = 40;
        _this.currentSlide = 0;
        _this._lastPos = 0;
        _this.pos = 0;
        _this._ready = false;
        _this._transitioning = false;
        _this._transitionStart = false;
        _this._drag = 0;
        _this._direction = false;
        _this._ticking = false;

        _this._getSlides(_this._el, function (slides) {
            _this._slideImages = slides;
            var slideDimensions = _this._getSlideDimensions(slides);
            _this._height = slideDimensions.tallest;
            _this._createCanvasLayers(el);
            _this._slides = [];

            slides.forEach(function (slide, idx) {
                _this._slides.push(new Item(_this._ctx, slide, idx, _this._width, _this._height, _this._margin, slideDimensions[idx].width, slideDimensions[idx].height));
            });

            _this.currentPosition = _this._slides[_this.currentSlide].leftOffset;
            _this._numSlides = slides.length;
            _this._fullWidth = (_this._width + _this._margin) * (_this._numSlides - 1);
            _this._bindEvents();
            _this._ready = true;
            _this._draw();
            _this._slides[_this.currentSlide]._onDraw(_this.pos);
            _this.trigger('ready');
        });
        return _this;
    }

    Gallery.prototype._getSlides = function _getSlides(gallery, cb) {
        var promises = [];
        var slides = Array.from(gallery.querySelectorAll('.gallery__item'));

        slides.forEach(function (slide, idx) {
            var src = slide.src;
            var img = document.createElement('img');
            var width = undefined,
                height = undefined;

            var promise = new Promise(function (resolve, reject) {
                img.onload = function () {
                    resolve(img);
                };

                img.onerror = function () {
                    reject('image could not load');
                };
            });

            promises.push(promise);
            img.src = src;
        });

        return Promise.all(promises).then(cb);
    };

    Gallery.prototype._getSlideDimensions = function _getSlideDimensions(slides) {
        var _this2 = this;

        var tallest = 0;
        var info = {};

        slides.forEach(function (slide, idx) {
            var dimensions = _this2._scaleImageDimensions(slide.width, slide.height, _this2._width, _this2._maxHeight);
            tallest = dimensions.height > tallest ? dimensions.height : tallest;
            info[idx] = dimensions;
        });

        info.tallest = tallest;
        return info;
    };

    Gallery.prototype._scaleImageDimensions = function _scaleImageDimensions(width, height, galleryMaxWidth, galleryMaxHeight) {
        var itemRatio = width / height;
        var galleryRatio = galleryMaxWidth / galleryMaxHeight;
        var willScaleXAxis = itemRatio >= galleryRatio;
        var newWidth = Math.round(willScaleXAxis ? galleryMaxWidth : width * galleryMaxHeight / height);
        var newHeight = Math.round(willScaleXAxis ? height * galleryMaxWidth / width : galleryMaxHeight);

        return {
            width: newWidth,
            height: newHeight
        };
    };

    Gallery.prototype._createCanvasLayers = function _createCanvasLayers(gallery) {
        this._canvas = document.createElement('canvas');
        this._canvas.width = this._width;
        this._canvas.height = this._height;
        this._ctx = this._canvas.getContext('2d');

        // Put it out:
        gallery.appendChild(this._canvas);
    };

    Gallery.prototype._bindKeyEvents = function _bindKeyEvents() {
        var _this3 = this;

        document.addEventListener('keydown', function (e) {
            if (_this3._transitioning || e.altKey || e.ctrlKey || e.shiftKey) {
                return;
            }

            if (e.keyCode === 37) {
                e.preventDefault();
                _this3._goToSlide(_this3.currentSlide - 1, 500);
            } else if (e.keyCode === 39) {
                e.preventDefault();
                _this3._goToSlide(_this3.currentSlide + 1, 500);
            }
        });
    };

    Gallery.prototype._bindTouchEvents = function _bindTouchEvents() {
        var _this4 = this;

        this._hammer = new Hammer(this._canvas);
        this._hammer.on('pan', function (e) {
            _this4._direction = e.direction === 4 || e.direction === 2 ? e.direction : _this4._direction;
            _this4._drag = Math.round(e.deltaX);

            var tentativePos = _this4.currentPosition + _this4._drag * -1;
            if (tentativePos <= 0 || tentativePos >= _this4._fullWidth) {
                tentativePos = _this4.currentPosition + _this4._drag * -0.5;
            }

            _this4.pos = tentativePos;

            if (e.isFinal && Math.abs(_this4._drag) >= _this4._width / 3 && !_this4._isTerminal()) {
                var which = _this4._drag < 0 ? _this4.currentSlide + 1 : _this4.currentSlide - 1;
                _this4._goToSlide(which);
            } else if (e.isFinal) {
                _this4._transition(_this4.pos, _this4.currentPosition);
            }
        });
    };


    Gallery.prototype._bindResizeEvent = function _bindResizeEvent() {
        var _this5 = this;

        var resizeHandler = function resizeHandler(timestamp) {
            _this5._width = _this5._el.getBoundingClientRect().width;
            var slideDimensions = _this5._getSlideDimensions(_this5._slideImages);
            _this5._canvas.width = _this5._width;
            _this5._canvas.height = slideDimensions.tallest;
            _this5._slides.forEach(function (slide, idx) {
                slide.refresh(slideDimensions[idx].width, slideDimensions[idx].height, _this5._width, _this5._maxHeight);
            });
            _this5.off('draw', resizeHandler);
            _this5._clear();
            _this5._lastPos = false;
            _this5.pos = _this5._slides[_this5.currentSlide].leftOffset;

            _this5._ticking = false;
        };

        window.addEventListener('resize', function () {
            if (_this5._ticking) {
                return;
            }

            _this5._ticking = true;

            _this5.on('draw', resizeHandler);
        });
    };

    /**
     *
     *
     */

    Gallery.prototype._bindEvents = function _bindEvents() {
        this._bindKeyEvents();
        this._bindTouchEvents();
        this._bindResizeEvent();
    };

    /**
     * Detects if the current slide can move in the current direction.
     * @return { boolean }
     */

    Gallery.prototype._isTerminal = function _isTerminal() {
        return this.currentSlide === 0 && this._direction === 4 || this.currentSlide === this._numSlides - 1 && this._direction === 2;
    };

    /**
     * Creates a transition from one position to another.
     * @param { number } from
     * @param { number } to
     * @param { number = 250 } duration
     */

    Gallery.prototype._transition = function _transition(from, to) {
        var duration = arguments.length <= 2 || arguments[2] === undefined ? 250 : arguments[2];

        this._transitioning = true;
        this._transitionDuration = duration;
        this._transitionFrom = from;
        this._transitionTo = to;
    };

    /**
     * Advances to the next/previous slide.
     */

    Gallery.prototype._setCurrentPosition = function _setCurrentPosition() {
        var duration = arguments.length <= 0 || arguments[0] === undefined ? 250 : arguments[0];

        var dest = this._slides[this.currentSlide].leftOffset;
        this.currentPosition = dest;
        this._transition(this.pos, dest, duration);
    };

    /**
     * Goes to the specified slide.
     * @param { number } slideNo
     */

    Gallery.prototype._goToSlide = function _goToSlide(slideNo) {
        var duration = arguments.length <= 1 || arguments[1] === undefined ? 250 : arguments[1];

        if (slideNo < 0 || slideNo > this._numSlides - 1) {
            return;
        }

        this.currentSlide = slideNo;
        this._setCurrentPosition(duration);
        this.trigger('update');
    };

    /**
     * Returns the currently visible slides.
     * @param { number } pos - the current position
     * @return { array } slides
     */

    Gallery.prototype._getSlidesInView = function _getSlidesInView(pos) {
        var inView = [];

        this._slides.forEach(function (slide, idx) {
            if (pos >= slide.leftBound && pos <= slide.rightBound) {
                inView.push(idx);
            }
        });

        return inView;
    };

    /**
     * Clears the <canvas> for next paint.
     */

    Gallery.prototype._clear = function _clear() {
        return this._ctx.clearRect(0, 0, this._width, this._height);
    };

    /**
     * Callback executed at each animationFrame.
     * @param { number } timestamp
     */

    Gallery.prototype._draw = function _draw(timestamp) {
        var _this6 = this;

        this.trigger('draw', timestamp);

        if (typeof timestamp === 'undefined' || this.pos === this._lastPos && !this._transitioning || !this._ready) {
            this._raf = requestAnimationFrame(this._draw.bind(this));
            return;
        }

        if (this._transitioning) {
            if (this._transitionStart === false) {
                this._transitionStart = timestamp;
            }

            var delta = Math.min((timestamp - this._transitionStart) / this._transitionDuration, 1);
            this.pos = (this._transitionTo - this._transitionFrom) * delta * delta + this._transitionFrom;

            if (delta === 1) {
                this._transitioning = false;
                this._transitionStart = false;
            }
        }

        this._clear();
        this._getSlidesInView(this.pos).forEach(function (idx) {
            _this6._slides[idx].trigger('draw', _this6.pos);
        });

        this._lastPos = this.pos;
        this._raf = requestAnimationFrame(this._draw.bind(this));
    };

    return Gallery;
}(Emitter);

;

var Item = function (_Emitter2) {
    _inherits(Item, _Emitter2);

    /**
     * Constructor. See _getProps for parameters.
     */

    function Item() {
        _classCallCheck(this, Item);

        var _this7 = _possibleConstructorReturn(this, _Emitter2.call(this));

        _this7._getProps.apply(_this7, arguments);
        _this7._boundOnDraw = _this7._onDraw.bind(_this7);
        _this7.on('draw', _this7._boundOnDraw);
        return _this7;
    }

    /**
     * Callback executed when 'draw' event is triggered.
     * @param { number } pos
     */

    Item.prototype._onDraw = function _onDraw(pos) {
        var sx = 0;
        var sy = 0;
        var sWidth = this.width;
        var sHeight = this.height;
        var dx = this.leftOffset - pos + this.xOffset;
        var dy = 0 + this.yOffset;
        var dWidth = this.slideWidth;
        var dHeight = this.slideHeight;

        this._parallax(dx);
        this.output.drawImage(this.canvas, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
    };

    /**
     * Handles parallax effect.
     * @param { number } dx - the difference between the current position and the Item center.
     */

    Item.prototype._parallax = function _parallax(dx) {
        var multiplier = Math.round((dx - this.xOffset) * -0.25);
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.drawImage(this.img, multiplier, 0, this.width, this.height);
    };

    /**
     * Extracts parameters needed for setup.
     * @param { DOM node } output - the <canvas> to draw to _onDraw.
     * @param { DOM node } img - the <img> element that this slide is based on.
     * @param { number } idx - the index of this slide in relation to its' siblings.
     * @param { number } parentWidth - the width of the parent Gallery
     * @param { number } parentHeight - the height of the parent Gallery.
     * @param { number } margin - the amount of margin between each slide.
     * @param { number } slideWidth - the scaled width of the slide.
     * @param { number } slideHeight - the scaled height of the slide.
     */

    Item.prototype._getProps = function _getProps(output, img) {
        var idx = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];
        var parentWidth = arguments.length <= 3 || arguments[3] === undefined ? 400 : arguments[3];
        var parentHeight = arguments.length <= 4 || arguments[4] === undefined ? 400 : arguments[4];
        var margin = arguments.length <= 5 || arguments[5] === undefined ? 40 : arguments[5];
        var slideWidth = arguments[6];
        var slideHeight = arguments[7];

        this.idx = idx;
        this.margin = margin;
        this.refresh(slideWidth, slideHeight, parentWidth, parentHeight);

        this.output = output;
        this.img = img;
        this.width = this.img.width;
        this.height = this.img.height;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.ctx.drawImage(this.img, 0, 0, this.width, this.height);
    };

    /**
     * Calculates positioning and offsets.
     * @param { number } slideWidth - the scaled width of the slide.
     * @param { number } slideHeight - the scaled height of the slide.
     * @param { number } parentWidth - the width of the parent Gallery
     * @param { number } parentHeight - the height of the parent Gallery.
     */

    Item.prototype.refresh = function refresh(slideWidth, slideHeight, parentWidth, parentHeight) {
        this.slideWidth = slideWidth;
        this.slideHeight = slideHeight;
        this.parentWidth = parentWidth;
        this.parentHeight = parentHeight;
        this.xOffset = (parentWidth - slideWidth) / 2;
        this.yOffset = (parentHeight - slideHeight) / 2;
        this.leftBound = (this.idx - 1) * this.parentWidth + this.idx * this.margin;
        this.rightBound = (this.idx + 1) * this.parentWidth + this.idx * this.margin;
        this.leftOffset = this.idx * this.parentWidth + this.idx * this.margin;
    };

    return Item;
}(Emitter);

;

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
//
// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
//
// MIT license
(function () {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () {
                callback(currTime + timeToCall);
            }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    }
})();

var gallery = new Gallery(document.getElementById('gallery'));
