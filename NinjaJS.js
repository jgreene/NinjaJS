// Copyright (c) 2012 Justin Greene
// NinajS - A mini html5 canvas javascript framework
// for multi touch drag and drop.
// MIT License

var NinjaJS = (function() {
    var getUserPositions = function(stage, e) {
        var pos = stage.getContainerPosition();
        var touches = _.map(e.touches, function(touch) {
            var touchX = (touch.clientX - pos.left + window.pageXOffset) * stage.resizeRatio;
            var touchY = (touch.clientY - pos.top + window.pageYOffset) * stage.resizeRatio;

            return {
                x: touchX,
                y: touchY,
                identifier: touch.identifier
            };
        });

        if (touches.length > 0) {
            return touches;
        }

        var mouseX = (e.clientX - pos.left + window.pageXOffset) * stage.resizeRatio;
        var mouseY = (e.clientY - pos.top + window.pageYOffset) * stage.resizeRatio;

        return [{
            x: mouseX,
            y: mouseY,
            identifier: 'mouse'
        }];
    };


    var addListeners = function(stage) {

        var dragStart = function(e) {
            e.preventDefault();

            var touches = getUserPositions(stage, e);
            var usedTouches = [];
            for (var i = stage.shapes.length - 1; i >= 0; i--) {
                var shape = stage.shapes[i];

                var touch = _.first(_.filter(touches, function(t) {
                    return shape.isPointInPath(t.x, t.y);
                }));

                if (touch == null || _.include(usedTouches, touch)) { continue; }

                var isDragging = shape.isDragging();
                shape.dragPoint = touch;

                usedTouches.push(touch);



                if (!isDragging && shape.isDragging()) {
                    e.userPosition = touch;
                    shape.trigger('dragstart', e);
                }
            }
        };

        var dragMove = function(e) {
            e.preventDefault();
            var touches = getUserPositions(stage, e);

            var updateStage = false;

            _.each(stage.shapes, function(shape) {
                if (!shape.isDragging()) { return; }

                var touch = _.find(touches, function(t) {
                    return t.identifier === shape.dragPoint.identifier;
                });

                if (touch == null) { return; }

                var diffX = shape.dragX ? touch.x - shape.dragPoint.x : 0;
                var diffY = shape.dragY ? touch.y - shape.dragPoint.y : 0;

                if (diffX != 0 || diffY != 0) {
                    shape.move(diffX, diffY);
                    e.userPosition = touch;
                    shape.isMoving = true;
                    e.draggedX = diffX;
                    e.draggedY = diffY;
                    shape.trigger('dragmove', e);
                    shape.dragPoint = touch;

                    updateStage = true;
                }

            });

            if (updateStage)
                stage.draw();

        };

        var dragEnd = function(e) {
            e.preventDefault();

            var touches = getUserPositions(stage, e);

            _.each(stage.shapes, function(shape) {
                if (!shape.isDragging()) { return; }

                var touch = _.find(touches, function(t) {
                    return t.identifier === shape.dragPoint.identifier;
                });

                if (!e.touches || touch == null) {
                    e.userPosition = shape.dragPoint;
                    shape.dragPoint = null;
                    shape.isMoving = false;
                    shape.trigger('dragend', e);
                }
            });
        };

        var mouseOver = function(e) {

            var touches = getUserPositions(stage, e);

            _.each(stage.shapes, function(shape) {
                var hasTouch = _.any(touches, function(t) {
                    return shape.isPointInPath(t.x, t.y);
                });

                if (hasTouch) {
                    shape.isMousedOver = true;
                    shape.trigger('mouseover', e);
                }else if (shape.isMousedOver && !hasTouch) {
                    shape.isMousedOver = false;
                    shape.trigger('mouseout', e);
                }
            });
        };

         var createInputEvent = function(eventName) {
            return function(e) {
                e.preventDefault();
                var touches = getUserPositions(stage, e);

                _.each(stage.shapes, function(shape) {

                    if (shape.draggable) { return; }

                    var touch = _.first(_.filter(touches, function(t) {
                        return shape.isPointInPath(t.x, t.y);
                    }));

                    if (touch == null) { return; }

                    e.userPosition = touch;

                    shape.trigger(eventName, e);
                });
            };
        };

        var tapStart = function(e) {
            e.preventDefault();
            var touches = getUserPositions(stage, e);

            var usedTouches = [];

            for (var i = stage.shapes.length - 1; i >= 0; i--) {
                (function(i) {
                    var shape = stage.shapes[i];

                    if (shape.isMoving) { return; }

                    var touch = _.first(_.filter(touches, function(t) {
                        return shape.isPointInPath(t.x, t.y);
                    }));

                    if (touch == null || _.include(usedTouches, touch)) { return; }

                    if (!shape.taps) {
                        shape.taps = [];
                    }
                    shape.taps.push(touch);

                    usedTouches.push(touch);

                    setTimeout(function() {
                        shape.taps = [];
                    }, 300);

                })(i);
            }

        }

        var tapMove = function(e) {
            e.preventDefault();
            _.each(stage.shapes, function(shape) {
                shape.taps = [];
            });
        }

        var tapEnd = function(e) {
            e.preventDefault();
            _.each(stage.shapes, function(shape) {
                if (!shape.taps) { return; }
                if (shape.taps.length > 0) {
                    e.taps = shape.taps;
                    e.userPosition = _.last(e.taps);
                    shape.trigger('tap', e);
                }
            });
        }

        var click = function(e) {
            e.preventDefault();

            var touches = getUserPositions(stage, e);

            _.each(stage.shapes, function(shape) {
                if (shape.isMoving) { return; }

                var touch = _.first(_.filter(touches, function(t) {
                    return shape.isPointInPath(t.x, t.y);
                }));

                if (touch == null) { return; }

                e.userPosition = touch;

                shape.trigger('click', e);

            });
        }



        stage.canvas.addEventListener('touchstart', dragStart, false);
        stage.canvas.addEventListener('touchmove', dragMove, false);
        stage.canvas.addEventListener('touchend', dragEnd, false);

        stage.canvas.addEventListener('mousedown', dragStart, false);
        stage.canvas.addEventListener('mousemove', dragMove, false);
        stage.canvas.addEventListener('mouseup', dragEnd, false);

        stage.canvas.addEventListener('touchstart', createInputEvent('inputstart'), false);
        stage.canvas.addEventListener('touchmove', createInputEvent('inputmove'), false);
        stage.canvas.addEventListener('touchend', createInputEvent('inputend'), false);

        stage.canvas.addEventListener('mousedown', createInputEvent('inputstart'), false);
        stage.canvas.addEventListener('mousemove', createInputEvent('inputmove'), false);
        stage.canvas.addEventListener('mouseup', createInputEvent('inputend'), false);

        stage.canvas.addEventListener('touchstart', tapStart, false);
        stage.canvas.addEventListener('touchmove', tapMove, false);
        stage.canvas.addEventListener('touchend', tapEnd, false);

        stage.canvas.addEventListener('mousedown', tapStart, false);
        stage.canvas.addEventListener('mousemove', tapMove, false);
        stage.canvas.addEventListener('mouseup', tapEnd, false);

        stage.canvas.addEventListener('mousemove', mouseOver, false);

        stage.canvas.addEventListener('click', click, false);
    };

    var getResizeRatio = function(dim, maxWidth, maxHeight) {

        var ratioX = maxWidth / dim.width;
        var ratioY = maxHeight / dim.height;
        return (function() {
            if (ratioX <= ratioY) {
                return ratioX;
            }

            return ratioY;
        })();
    }

    var getResizeDimensions = function(dim, maxWidth, maxHeight) {

        var ratio = getResizeRatio(dim, maxWidth, maxHeight);

        return { width: Math.round(dim.width * ratio), height: Math.round(dim.height * ratio) };
    };

    var removeItem = function(arr) {
        var what, a = arguments, L = a.length, ax;
        while (L > 1 && arr.length) {
            what = a[--L];
            while ((ax = arr.indexOf(what)) != -1) {
                arr.splice(ax, 1);
            }
        }
        return arr;
    };



    var Stage = (function() {


        return function(elem, canvasWidth, canvasHeight, actualWidth, actualHeight) {
            var self = this;
            this.container = elem;
            this.canvas = document.createElement('canvas');
            this.canvas.width = canvasWidth;
            this.canvas.height = canvasHeight;
            this.context = this.canvas.getContext('2d');
            this.width = canvasWidth;
            this.height = canvasHeight;
            this.shapes = [];
            this.maxZ = 0;
            this.resizeRatio = 1;

            this.container.appendChild(this.canvas);

            this.add = function(shape) {
                shape.stage = self;
                shape.z = self.maxZ + 1;
                self.maxZ = shape.z;
                this.shapes.push(shape);
            };

            this.remove = function(shape) {
                removeItem(this.shapes, shape);
            };

            this.reorder = function() {
                self.shapes.sort(function(a, b) {
                    return a.z - b.z;
                });
            };

            this.getContainerPosition = function() {
                var _x = 0;
                var _y = 0;
                var el = self.canvas;
                while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
                    _x += el.offsetLeft - el.scrollLeft;
                    _y += el.offsetTop - el.scrollTop;
                    el = el.offsetParent;
                }
                return { top: _y, left: _x };
            };

            this.clear = function() {
                var context = self.context;
                var canvas = self.canvas;
                context.clearRect(0, 0, canvas.width, canvas.height);
            };

            this.draw = function() {
                setTimeout(function() {
                    self.clear();
                    self.reorder();
                    self.shapes.forEach(function(s) { s.draw(); });
                }, 0);
            };

            this.resizeCanvas = function(w, h) {
                var dim = getResizeDimensions({ width: self.canvas.width, height: self.canvas.height }, w, h);

                self.resizeRatio = 1 / getResizeRatio({ width: self.canvas.width, height: self.canvas.height }, w, h);

                self.canvas.style.width = dim.width + 'px';
                self.canvas.style.height = dim.height + 'px';

            }

            addListeners(self);

            if (actualWidth && actualHeight) {
                self.resizeCanvas(actualWidth, actualHeight);
            }


        };
    })();

    var Shape = (function() {

        return function(drawFunc) {
            var self = this;
            this.visible = true;
            this.drawFunc = drawFunc;
            this.x = 0;
            this.y = 0;
            this.z = 0;
            this.scale = 1;
            this.taps = 0;
            this.events = {};
            this.dragPoint = null;
            this.draggable = false;
            this.dragX = true;
            this.dragY = true;
            this.rotation = 0;

            this.isDragging = function() {
                if (self.draggable === false)
                    return false;

                return self.dragPoint != null;
            };


            this.getCanvas = function() {
                if (!self.canvas)
                    self.canvas = document.createElement('canvas');
                return self.canvas;
            };

            this.getContext = function() {
                if (!self.context)
                    self.context = self.canvas.getContext('2d');
                return self.context;
            };

            this.redraw = function() {
                this.canvas = document.createElement('canvas');
                this.context = self.canvas.getContext('2d');
                this.drawFunc.call(self);
            };

            this.draw = function() {
                if (!self.visible) { return; }

                var context = self.stage.context;
                var cachedCanvas = self.getCanvas();
                context.save();

                if (self.x !== 0 || self.y !== 0) {
                    context.translate(self.x, self.y);
                }

                context.drawImage(cachedCanvas, 0, 0, cachedCanvas.width, cachedCanvas.height, 0, 0, cachedCanvas.width, cachedCanvas.height);
                context.restore();


            };

            this.animateTo = (function() {
                var isAnimating = false;
                return function(endX, endY, onMove) {
                    var shape = self;
                    if (isAnimating === true) { return; }

                    var distanceX = endX - shape.x;
                    var distanceY = endY - shape.y;

                    if (distanceX === 0 && distanceY === 0) { return; }

                    var divisor = 4;

                    var distanceXToMove = distanceX < 0 ? Math.ceil(distanceX / divisor) : Math.floor(distanceX / divisor);

                    var distanceYToMove = distanceY < 0 ? Math.ceil(distanceY / divisor) : Math.floor(distanceY / divisor);

                    if (distanceXToMove === 0) {
                        distanceXToMove = distanceX;
                    }

                    if (distanceYToMove === 0) {
                        distanceYToMove = distanceY;
                    }

                    isAnimating = true;

                    setTimeout(function() {
                        isAnimating = false;
                        shape.move(distanceXToMove, distanceYToMove);

                        if (onMove) {
                            onMove();
                        }

                        self.stage.draw();

                        self.animateTo(endX, endY, onMove);

                    }, 1000 / 60);
                };
            })();


            this.bind = function(eventName, func) {
                var e = self.events[eventName];
                if (!e) {
                    e = [];
                    self.events[eventName] = e;
                }
                e.push(func);
            }

            this.trigger = function(eventName, e) {
                var events = self.events[eventName];
                if (events) {
                    for (var i = 0; i < events.length; i++) {
                        events[i](e);
                    }
                }
            }

            this.unbind = function(eventName) {
                var e = self.events[eventName];
                if (e) {
                    delete self.events[eventName];
                }
            }

            this.setPosition = function(x, y) {
                self.x = x;
                self.y = y;
            }

            this.isPointInPath = function(x, y) {
                var normalized = { x: x - this.x, y: y - this.y };

                return self.getContext().isPointInPath(normalized.x, normalized.y);
            }

            this.moveToTop = function() {
                self.z = self.stage.maxZ + 1;
                self.stage.maxZ = self.z;
                self.stage.reorder();
            }

            this.move = function(x, y) {
                self.x += x;
                self.y += y;
            }

            this.redraw();
        }
    })();

    return {
        Stage: Stage,
        Shape: Shape
    };
})();
