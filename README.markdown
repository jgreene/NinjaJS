NinjaJS - A tiny HTML5 canvas framework
=======================================

NinjaJS is a tiny HTML5 canvas framework that adds support for multitouch drag and drop. (along with some other events)

Dependencies: [underscore.js](http://documentcloud.github.com/underscore/)

There are two simple classes included:

* Shape: This is the main class you'll be working with.  You create a shape by providing it with a draw function.

        var shape = new NinjaJS.Shape(function(){
            var canvas = this.getCanvas();
            var ctx = this.getContext();
            ctx.fillRect(25,25,100,100);  
            ctx.clearRect(45,45,60,60);  
            ctx.strokeRect(50,50,50,50);  
        });

    - When a shape is drawn it is cached in it's own canvas object for performance reasons (expensive draw methods are no longer so expensive).  To redraw the shape we simply call the shape.redraw() method.  This should only be done when the shape actually changes in some way.

    - To make a shape draggable we set it's draggable property:

            shape.draggable = true;

    - To bind to the shapes events we simply call:

            shape.bind('eventName', function(e){
                //Your code here
            });

    - The supported events are:
        * dragstart
        * dragmove
        * dragend
        * inputstart
        * inputmove
        * inputend
        * mouseover
        * mouseout
        * tap : tap receives an array of taps that corrispond with touches/mouse clicks.  To check for a double tap simply do:

                shape.bind('tap', function(e){
                    if(e.taps.length !=== 2) { return ;}
                    // your double tap logic here
                });

    - There are various helper functions for working with shapes they are:
        * setPosition(x,y) - sets the position of the shape to the given x and y coordinates
        * isPointInPath(x,y) - returns true/false depending upon whether the provider coordinates are inside the shapes path
        * moveToTop() - moves the shape to the top in the z-index
        * move(x,y) - moves the shape by the specified amount

* Stage: This object is our main canvas.  We pass it's constructor a containerId, a width, and a height.
    
            var stage = new NinaJS.Stage('containerId', 400, 400);

    - Next we add shapes to it.

            var shape = new NinjaJS.Shape(function(){
                var canvas = this.getCanvas(); //get's this shapes canvas
                var ctx = this.getContext(); //get's this shapes context for the above canvas

                ctx.fillRect(25,25,100,100);  
                ctx.clearRect(45,45,60,60);  
                ctx.strokeRect(50,50,50,50);  
            });

            shape.bind('dragmove', function(e){
                console.log('moving');
            });

            shape.draggable = true;

            stage.add(shape);

    - Once we have added all of our shapes we simpley call:

            stage.draw();


And now we're done.  Try adding lots of shapes and moving them all at once on your iPad! 
