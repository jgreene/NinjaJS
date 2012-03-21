// Copyright (c) 2012 Justin Greene
// NinajS - A mini html5 canvas javascript framework for multi touch drag and drop.
// MIT License

var NinjaJS = {};

NinjaJS.Stage = (function(){
    var getUserPositions = function(stage, e){
        var pos = stage.getContainerPosition();
        var touches = _.map(e.touches, function(touch){
            var touchX = touch.clientX - pos.left + window.pageXOffset;
            var touchY = touch.clientY - pos.top + window.pageYOffset;

            return {
                x: touchX,
                y: touchY,
                identifier: touch.identifier
            };
        });

        if(touches.length > 0){
            return touches;
        }

        var mouseX = e.clientX - pos.left + window.pageXOffset;
        var mouseY = e.clientY - pos.top + window.pageYOffset;

        return [{
            x: mouseX,
            y: mouseY,
            identifier: 'mouse'
        }];
    };


    var addListeners = function(stage){

        var dragStart = function(e){
            e.preventDefault();

            var touches = getUserPositions(stage, e);

            var usedTouches = [];

            for(var i = stage.shapes.length - 1; i >= 0; i--){
                var shape = stage.shapes[i];

                var touch = _.first(_.filter(touches, function(t){
                    return shape.isPointInPath(t.x, t.y);
                }));

                if(touch == null || _.include(usedTouches, touch)) { continue; }

                var isDragging = shape.isDragging();
                shape.dragPoint = touch;

                usedTouches.push(touch);

                if(!isDragging && shape.isDragging()){
                    e.userPosition = touch;
                    shape.trigger('dragstart', e);
                }
            }
        };

        var dragMove = function(e){
            e.preventDefault();
            var touches = getUserPositions(stage, e);

            var updateStage = false;

            _.each(stage.shapes, function(shape){
                if(!shape.isDragging()){ return; }

                var touch = _.find(touches, function(t){ 
                    return t.identifier === shape.dragPoint.identifier;
                });

                if(touch == null) { return; }

                var diffX = touch.x - shape.dragPoint.x;
                var diffY = touch.y - shape.dragPoint.y;

                if(diffX != 0 || diffY != 0){
                    shape.move(diffX, diffY);
                    shape.dragPoint = touch;
                    shape.isMoving = true;
                    e.userPosition = touch;
                    shape.trigger('dragmove', e);
                    updateStage = true;
                }

            });

            if(updateStage)
                stage.draw();

        };

        var dragEnd = function(e){
            e.preventDefault();

            var touches = getUserPositions(stage, e);

            _.each(stage.shapes, function(shape){
                if(!shape.isDragging()){ return; }

                var touch = _.find(touches, function(t){ 
                    return t.identifier === shape.dragPoint.identifier; 
                });

                if(!e.touches || touch == null){
                    shape.dragPoint = null;
                    shape.isMoving = false;
                    shape.trigger('dragend', e);
                }
            });
        };

        var mouseOver = function(e){

            var touches = getUserPositions(stage, e);

            _.each(stage.shapes, function(shape){
                var hasTouch = _.any(touches, function(t){
                    return shape.isPointInPath(t.x, t.y);
                });

                if(hasTouch){
                    shape.isMousedOver = true;
                    shape.trigger('mouseover', e);
                }else if(shape.isMousedOver && !hasTouch){
                    shape.isMousedOver = false;
                    shape.trigger('mouseout', e);
                }
            });
        };

        var doubleTap = function(e){
            var touches = getUserPositions(stage, e);

            _.each(stage.shapes, function(shape){
                if(shape.isMoving){ return; }

                var touch = _.first(_.filter(touches, function(t){
                    return shape.isPointInPath(t.x, t.y);
                }));

                if(touch == null) { return; }

                e.userPosition = touch;

                shape.taps = shape.taps + 1;
                if(shape.taps >= 2){
                    shape.taps = 0;
                    shape.trigger('dbltap', e);
                };

                setTimeout(function(){
                    shape.taps = 0;
                }, 300);
            });

        }

        stage.canvas.addEventListener('touchstart', doubleTap, false);
        stage.canvas.addEventListener('touchstart', dragStart, false);
        stage.canvas.addEventListener('touchmove', dragMove, false);
        stage.canvas.addEventListener('touchend', dragEnd, false);

        stage.canvas.addEventListener('mousedown', doubleTap, false);
        stage.canvas.addEventListener('mousedown', dragStart, false);
        stage.canvas.addEventListener('mousemove', dragMove, false);
        stage.canvas.addEventListener('mouseup', dragEnd, false);

        stage.canvas.addEventListener('mousemove', mouseOver, false);
    };

    return function(id, width, height){
        var self = this;
        this.container = document.getElementById(id);
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.context = this.canvas.getContext('2d');
        this.width = width;
        this.height = height;
        this.shapes = [];
        this.maxZ = 0;

        this.container.appendChild(this.canvas);

        this.add = function(shape){
            shape.stage = self;
            shape.z = self.maxZ + 1;
            self.maxZ = shape.z;
            this.shapes.push(shape);
        };

        this.reorder = function(){
            self.shapes.sort(function(a, b){
                return a.z - b.z;
            });
        }

        this.getContainerPosition = function(){
            var obj = self.container;
            var top = 0;
            var left = 0;
            while (obj && obj.tagName != "BODY") {
                top += obj.offsetTop;
                left += obj.offsetLeft;
                obj = obj.offsetParent;
            }
            return {
                top: top,
                left: left
            };
        };

        this.clear = function(){
            var context = self.context;
            var canvas = self.canvas;
            context.clearRect(0, 0, canvas.width, canvas.height);
        };

        this.draw = function(){
            setTimeout(function(){
                self.clear();
                self.shapes.forEach(function(s){ s.draw(); });
            }, 0);
        }

        addListeners(self);

    };
})();

NinjaJS.Shape = (function(){

    return function(drawFunc){
        var self = this;
        this.visible = true;
        this.drawFunc = drawFunc;
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.taps = 0;
        this.events = {};
        this.dragPoint = null;
        this.draggable = false;

        this.isDragging = function(){
            if(self.draggable === false)
                return false;

            return self.dragPoint != null;
        }


        this.getCanvas = function(){
            if(!self.canvas)
                self.canvas = document.createElement('canvas');
            return self.canvas;
        };

        this.getContext = function(){
            if(!self.context)
                self.context = self.canvas.getContext('2d');
            return self.context;
        }

        this.redraw = function(){
            this.canvas = document.createElement('canvas');
            this.context = self.canvas.getContext('2d');
            this.drawFunc.call(self);
        }

        this.draw = function(){
            if(!self.visible){ return; }

            var context = self.stage.context;
            var cachedCanvas = self.getCanvas();
            context.save();

            if (self.x !== 0 || self.y !== 0) {
                context.translate(self.x, self.y);
            }
            
            context.drawImage(cachedCanvas, 0, 0, cachedCanvas.width, cachedCanvas.height, 0, 0, cachedCanvas.width, cachedCanvas.height);
            context.restore();
        }
        

        this.bind = function(eventName, func){
            var e = self.events[eventName];
            if(!e){
                e = [];
                self.events[eventName] = e;
            }
            e.push(func);
        }

        this.trigger = function(eventName, e){
            var events = self.events[eventName];
            if(events){
                for(var i = 0; i < events.length; i++){
                    events[i](e);
                }
            }
        }

        this.unbind = function(eventName){
            var e = self.events[eventName];
            if(e){
                delete self.events[eventName];
            }
        }

        this.setPosition = function(x,y){
            self.x = x;
            self.y = y;
        }

        this.isPointInPath = function(x,y){
            var normalized = { x: x - this.x, y: y - this.y }
    
            return self.getContext().isPointInPath(normalized.x, normalized.y);
        }

        this.moveToTop = function(){
            self.z = self.stage.maxZ + 1;
            self.stage.maxZ = self.z;
            self.stage.reorder();
        }

        this.move = function(x,y){
            self.x += x;
            self.y += y;
        }

        this.redraw();
    }
})();