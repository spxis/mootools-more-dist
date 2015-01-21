/*
---
name: Chain.Wait Tests
requires: [More/Chain.Wait]
provides: [Chain.Wait.Tests]
...
*/
describe('Chain.Wait', function(){

	it('should wait some milliseconds between firing the functions', function(){

		var chain = this.chain = new Chain(),
			first = jasmine.createSpy(),
			second = jasmine.createSpy(),
			third = jasmine.createSpy();

		chain.chain(function(){
			first();
			chain.callChain();
		});

		chain.wait(400);
		chain.chain(function(){
			second();
			chain.callChain();
		});

		chain.wait(400);
		chain.chain(function(){
			third();
			chain.callChain();
		});

		// start chain
		chain.callChain();

		// first
		runs(function(){
			expect(first).toHaveBeenCalled();
		});

		// second
		waits(500);
		runs(function(){
			expect(second).toHaveBeenCalled();
		});

		// third
		waits(900);
		runs(function(){
			expect(third).toHaveBeenCalled();
		});

	});

	it('should not break the chainComplete event in Fx', function(){
		var count = 0;
		new Fx({
			link: 'chain',
			onChainComplete: function(){
				count++;
			},
			duration: 50
		}).start(0, 1).wait(40).start(1, 0);

		waits(500);

		runs(function(){
			expect(count).toEqual(1);
		});

	});

});

/*
---
name: Class.Binds Tests
requires: [More/Class.Binds]
provides: [Class.Binds.Tests]
...
*/
describe('Class.Binds', function(){

	it('should autobind methods', function(){

		var UnboundClass = new Class({
			context: function(){ return this; }
		});

		var BoundClass = new Class({
			Binds: ['context'],
			initialize: function(){},
			context: function(){ return this; }
		});

		var boundInstance = new BoundClass(),
			unboundInstance = new UnboundClass();

		expect(boundInstance.context.apply(false)).toEqual(boundInstance);
		expect(unboundInstance.context.apply(false)).not.toEqual(unboundInstance);

	});

	it('should work when initialize is not defined in class', function(){

		var BoundClassNoInit = new Class({
			Binds: ['context'],
			context: function(){ return this; }
		});

		var boundInstance = new BoundClassNoInit();
		expect(boundInstance.context.apply(false)).toEqual(boundInstance);

	});

	it('should work when Binds mutator is after initialize', function(){

		var BoundClass = new Class({
			initialize: function(){},
			context: function(){ return this; },
			Binds: ['context']
		});

		var boundInstance = new BoundClass();
		expect(boundInstance.context.apply(false)).toEqual(boundInstance);

	});

	it('should work with setOptions', function(){

		var BoundClass = new Class({
			Implements: [Options],
			Binds: ['getOption'],
			options: {option: false},
			initialize: function(options){ this.setOptions(options); },
			getOption: function(){ return this.options.option; }
		});

		expect(new BoundClass({option: true}).getOption.apply(false)).toEqual(true);

	});

	it('should retain binders from ancestors', function(){
		
		var Parent = new Class({
			Binds: ['foo'],
			fooValue: 'foo',
			foo: function(){
				return this.fooValue;
			}
		});
		
		var Child = new Class({
			Extends: Parent,
			Binds: ['bar'],
			barValue: 'bar',
			bar: function(){
				return this.barValue;
			}
		});
		expect(new Child().foo.apply(false)).toEqual('foo');
		expect(new Child().bar.apply(false)).toEqual('bar');
	});

});

/*
---
name: Class.Occlude Tests
requires: [More/Class.Occlude]
provides: [Class.Occlude.Tests]
...
*/
describe('Class.Occlude', function(){

	var testDiv = new Element('div');

	var Tester = new Class({
		Implements: Class.Occlude,
		property: 'Tester',
		initialize: function(element){
			this.element = $(element);
			if (this.occlude()) return this.occluded;
		}
	});

	var Tester2 = new Class({
		Implements: Class.Occlude,
		initialize: function(element){
			this.element = $(element);
			if (this.occlude()) return this.occluded;
		}
	});

	var t1 = new Tester(testDiv),
		t2 = new Tester(testDiv),
		t3 = new Tester(testDiv);

	var t21 = new Tester2(testDiv),
		t22 = new Tester2(testDiv),
		t23 = new Tester2(testDiv);

	it('should not create a new instance so that occluded classes equate', function(){
		expect(t1 == t2).toBeTruthy();
		expect(t1 == t3).toBeTruthy();
	});

	it('should not create new intances without the occlude `property` property ', function(){
		expect(t21 == t22).toBeTruthy();
		expect(t21 == t23).toBeTruthy();
		expect(t1 == t21).toBeFalsy();
	});

});

/*
---
name: Class.Refactor Tests
requires: [More/Class.Refactor]
provides: [Class.Refactor.Tests]
...
*/
describe('Class.Refactor', function(){

	var Test = new Class({
		options: {
			foo: 'bar',
			something: 'else'
		},
		untouched: function(){
			return 'untouched';
		},
		altered: function(){
			return 'altered';
		}
	});
	Test.static_method = function(){return 'static';};
	Class.refactor(Test, {
		options: {foo: 'rab'},
		altered: function(){
			return 'this is ' + this.previous();
		}
	});
	var Test2 = new Class({
		altered: function(){
			return 'altered';
		}
	});
	Class.refactor(Test2, {
		altered: function(){
			return 'this is ' + this.previous();
		}
	});
	Class.refactor(Test2, {
		altered: function(){
			return this.previous() + ' for reals.';
		}
	});
	var Test3 = new Class({
	});
	Test3.prototype.origin = function(){
		return "original origin";
	};
	Class.refactor(Test3, {
		origin: function(){
			return "refactored origin " + this.previous();
		}
	});


	it('should return a method that has been altered twice', function(){
		expect(new Test2().altered()).toEqual('this is altered for reals.');
	});

	it('should return an unaltered method', function(){
		expect(new Test().untouched()).toEqual('untouched');
	});

	it('should return an altred method', function(){
		expect(new Test().altered()).toEqual('this is altered');
	});

	it('should return an altered property', function(){
		expect(new Test().options.foo).toEqual('rab');
	});

	it('should return an unaltered property', function(){
		expect(new Test().options.something).toEqual('else');
	});

	it('should return the original origin', function(){
		expect(new Test3().origin()).toEqual('refactored origin original origin');
	});

	var Test4 = new Class({
		untouched: function(){
			return 'untouched';
		}
	});
	var RefactoredTest4 = Class.refactor(Test4, {
		foo: function(){
			return this.previous();
		}
	});

	it('should return the class refactored class as well', function(){
		expect(Test4).toEqual(RefactoredTest4);
	});

	it('should have a previous method for each refactored method', function(){
		var test = new Test4();
		expect(test.foo).not.toThrow();
		expect(test.foo()).toBe(undefined);
		expect(test.untouched()).toEqual('untouched');
	});

});

/*
---
name: Events.Pseudos Tests
requires: [More/Events.Pseudos]
provides: [Events.Pseudos.Tests]
...
*/
describe('Events.Pseudos', function(){

	it('should implement DOMEvent.Psuedos in already existing classes defined in core', function(){
		var callback = jasmine.createSpy('complete'),
			fx = new Fx();

		fx.addEvent('complete:once', callback);
		fx.fireEvent('complete').fireEvent('complete');

		expect(callback).toHaveBeenCalled();
		expect(callback.callCount).toEqual(1);
	});

	describe(':once pseudo', function(){

		it('should only fire once', function(){
			var fn1 = jasmine.createSpy('once pseudo one'),
				fn2 = jasmine.createSpy('once pseudo two');

			var e = new Events();
			e.addEvent('connect:once', fn1).addEvent('connect:once', fn2);
			e.fireEvent('connect', 4);
			e.fireEvent('connect', 3);
			e.fireEvent('connect', 2);

			expect(fn1).toHaveBeenCalledWith(4);
			expect(fn1).not.toHaveBeenCalledWith(3);
			expect(fn1).not.toHaveBeenCalledWith(2);

			expect(fn2).toHaveBeenCalledWith(4);
			expect(fn2).not.toHaveBeenCalledWith(3);
			expect(fn2).not.toHaveBeenCalledWith(2);

		});

		it('should call the original event callback', function(){
			var fn = jasmine.createSpy('original event'),
				e = new Events();

			e.addEvent('click:once', fn);
			e.fireEvent('click:once', 'foo');

			expect(fn).toHaveBeenCalledWith('foo');
		});

	});

	describe(':throttle pseudo', function(){

		it('should only fire once in a certain timespan', function(){
			//adding this extra pause here as otherwise this test fails intermittently when run with other tests for some reason - aaron
			waits(100);
			runs(function(){
			var fn1 = jasmine.createSpy(':throttle pseudo one'),
				fn2 = jasmine.createSpy(':throttle pseudo two'),
				events = new Events();

			events.addEvents({
				'scroll:throttle': fn1,
				'scroll:throttle(500)': fn2
			});

			for (var i = 20; i--;) events.fireEvent('scroll');

			// They should fire directly
			expect(fn1.callCount).toEqual(1);
			expect(fn2.callCount).toEqual(1);

			waits(375);

			runs(function(){

				// default time is 250, so firing scroll after 250 ms would fire the fist event
				for (var i = 20; i--;) events.fireEvent('scroll');

				expect(fn1.callCount).toEqual(2);
				expect(fn2.callCount).toEqual(1);

			});

			waits(500);

			runs(function(){

				// After another 500 ms all timeouts are cleared so both events will get called
				for (var i = 20; i--;) events.fireEvent('scroll');

				expect(fn1.callCount).toEqual(3);
				expect(fn2.callCount).toEqual(2);

			});
			});

		});

	});

	describe(':pause pseudo', function(){

		var events = new Events(),
			fn = jasmine.createSpy('pause event');

		it('should pause the event for 200 ms', function(){
			events.addEvent('code:pause(200)', fn);
			events.fireEvent('code', 1);
			events.fireEvent('code', 2);
			events.fireEvent.delay(400, events, 'code');

			expect(fn).not.toHaveBeenCalled();

			waits(300);

			runs(function(){
				expect(fn).toHaveBeenCalledWith(2);
				expect(fn.callCount).toEqual(1);
			});

			waits(400);

			runs(function(){
				// the delayed event should have fired
				expect(fn.callCount).toEqual(2);
			});

		});
	});

	describe('Events.definePseudo', function(){

		it('should call Pseudo function with split, fn, and args', function(){

			var eventFn =  function(){ return 'bar'; },
				eventArgs = ['one', 'two', 'three'],
				e = new Events();

			Events.definePseudo('test', function(split, fn, args){
				expect({
					event: split.event,
					value: split.value,
					pseudo: split.pseudo,
					original: split.original
				}).toEqual({
					event: 'e',
					value: 'foo',
					pseudo: 'test',
					original: 'e:test(foo)'
				});
				expect(fn).toEqual(eventFn);
				expect(Array.from(args)).toEqual(eventArgs);
				expect(this).toEqual(e);
			});

			e.addEvent('e:test(foo)', eventFn);
			e.fireEvent('e', eventArgs);

		});

	});

	describe('Multiple simultaneous pseudos', function(){

		var spy,
			myMonitor,
			order = [],
			e = new Events(),
			spies = {
			first: jasmine.createSpy(),
			second: jasmine.createSpy(),
			org: jasmine.createSpy()
		};

		it('should support adding events', function(){
			spy = function (split, fn, args, monitor){
				if (!split) spies.org();
				else spies[split.pseudo]();
				order.push(split ? split.pseudo : 'org');
				if (monitor) myMonitor = monitor;
				if (fn) fn.apply(this, args);
			};

			Events.definePseudo('first', spy);
			Events.definePseudo('second', spy);
			e.addEvent('test:first(org):second', spy).fireEvent('test');

			expect(spies.first).toHaveBeenCalled();
			expect(spies.second).toHaveBeenCalled();
			expect(spies.org).toHaveBeenCalled();

			expect(spies.first.callCount).toEqual(1);
			expect(spies.second.callCount).toEqual(1);
			expect(spies.org.callCount).toEqual(1);
		});

		it('should execute pseudos from left to right', function(){
			expect(order).toEqual(['first', 'second', 'org']);
		});

		it('should not remove event if inexact event string is provided', function(){
			e.removeEvent('test:first(org)', spy);
			expect(e.$events['test:first(org):second'][0]).toEqual(spy);
			expect(e.$events['test'][0]).toEqual(myMonitor);
		});

		it('should remove event only if exact event string is provided', function(){
			e.removeEvent('test:first(org):second', spy);
			expect(e.$events['test:first(org):second'][0]).not.toEqual(spy);
			expect(e.$events['test'][0]).not.toEqual(myMonitor);
		});

	});

});

/*
---
name: Slider
requires: [Core/Element.Dimensions, Core/Number, Class.Binds, Drag, Element.Measure]
provides: [Slider]
...
*/

/* THIS SPECS DO NOT WORK IN <IE9. Commented this and look forward to un-comment this when we stop supporting old browsers... */
/*
// specs code
describe('Slider.js', function (){

    // support jsFiddle: http://jsfiddle.net/N4req/
    
    function createEnviroment(){
        sliderContainer = new Element('div', {
            styles: {
                backgroundColor: '#555',
                height: '11px',
                margin: '20px',
                position: 'relative'
            }
        }).inject(environment);
        sliderKnob = new Element('div', {
            styles: {
                backgroundColor: '#ccf',
                height: '20px',
                width: '20px',
                position: 'absolute',
                top: '-5px'
            }
        }).inject(sliderContainer);
    }

    // function to format for Syn
    function dragCenterPos(el) {
        var dragPos = el.getPosition();
        var dragSize = el.getSize();
        return {
            pageX: dragPos.x + Math.round(dragSize.x / 2),
            pageY: dragPos.y + Math.round(dragSize.y / 2)
        }
    }

    //function to do the Drag
    function dragIt(from, to, el) {
        setTimeout(function (){
            Syn.drag({
                from: from,
                to: to,
                duration: 550
            }, el);
        }, 100);
    }
    var environment, sliderContainer, sliderKnob;
    environment = new Element('div', {
        styles: {
            width: '500px',
            height: '50px'
        }
    }).inject($(document.body));

    createEnviroment();
    var changeValue, moveValue, completeValue, tenthChange = [0];
    var maxPosition = (function (){
        var knob = sliderKnob.getPosition();
        var max = sliderContainer.getSize();
        return {
            pageX: knob.x + max.x,
            pageY: knob.y
        };
    })();

    var slider = new Slider(sliderContainer, sliderKnob, {
        range: [0, 10],
        steps: 20,
        initialStep: 0,
        onChange: function (value) {
            tenthChange.push(value);
            if (!changeValue) changeValue = value;
        },
        onComplete: function (value) {
            if (!completeValue) completeValue = value;
        },
        onMove: function (){
            moveValue = true;
        }
    })
    dragIt(dragCenterPos(sliderKnob), maxPosition, sliderKnob);

    it("should drag to last position when snap is set to true", function (){
        waits(1000);
        runs(function (){
            expect(completeValue).toEqual('10');
        });
    });

    it("should return correct type", function (){
        expect(typeof changeValue).toEqual('number');
        expect(typeof completeValue).toEqual('string');
    });

    it("should change in steps, and give decimal values", function (){
        expect(changeValue).toEqual(0.5);
        expect(tenthChange[10]).toEqual(5)
    });

    it("should fire move event", function (){
        expect(moveValue).toBeTruthy();
    });

    it("should NOT snap to values when snap is unset or false", function (){
        // reset Slider
        slider.set(0);
        slider.options.steps = false;
        changeValue = moveValue = completeValue = undefined;
        tenthChange = [0];
        dragIt(dragCenterPos(sliderKnob), maxPosition, sliderKnob);

        waits(1000);
        runs(function (){
            expect(tenthChange[10]).toBeLessThan(5); // 0.5 would be first step
        });
    });

    it("should handle correct numbers with decimals", function (){
        // reset Slider
        slider.detach();
        environment.empty();
        createEnviroment();
        changeValue = moveValue = completeValue = undefined;

        var slider2 = new Slider(sliderContainer, sliderKnob, {
            range: [0, 8067],
            steps: 10,
            initialStep: 0,
            onChange: function (value) {
                if (!changeValue) changeValue = value;
            },
            onComplete: function (value) {
                if (!completeValue) completeValue = value;
            }
        })

        changeValue = moveValue = completeValue = undefined;

        dragIt(dragCenterPos(sliderKnob), maxPosition, sliderKnob);

        waits(1000);
        runs(function (){
            expect(changeValue).toEqual(806.7);
            expect(completeValue).toEqual('8067');
        });
    });
});
*/
/*
---
name: Sortables
requires: [Core/Fx.Morph, Drag.Move]
provides: [Sortables]
...
*/

describe('Sortables', function () {

    // function to format for Syn
    function dragCenterPos(el) {
        var dragPos = el.getPosition();
        var dragSize = el.getSize();
        return {
            pageX: dragPos.x + Math.round(dragSize.x / 2),
            pageY: dragPos.y + Math.round(dragSize.y / 2)
        }
    }

    it('should fire the "complete" event after the clone is destroyed', function () {
        // support fiddle: http://jsfiddle.net/Px7sq/
        
        var environment = new Element('div', {
            styles: {
                width: '500px',
                height: '500px'
            }
        }).inject($(document.body));
        new Element('li', {
            alt: "1",
            styles: {
                width: '400px',
                height: '100px',
                backgroundColor: 'green'
            }
        }).inject(environment);
        new Element('li', {
            alt: "2",
            styles: {
                width: '400px',
                height: '100px',
                backgroundColor: 'black'
            }
        }).inject(environment);
        var presentElements = {
            withClones: 0,
            real: 0
        };
        var elements = document.getElements('li');
        
        new Sortables(environment, {
            clone: true,
            revert: true,
            onComplete: function () {
                this.serialize(function (el) {
                    presentElements.withClones++;
                });
                presentElements.real = this.elements.length;
            }
        });

        setTimeout(function () { // Syn needs some extra time
            Syn.drag({
                from: dragCenterPos(elements[0]),
                to: dragCenterPos(elements[1]),
                duration: 100
            }, elements[0]);
        }, 200);
        
        waits(400);
        runs(function () {
            expect(presentElements.withClones == presentElements.real).toBeTruthy();
            environment.destroy();
        });
    });
});
/*
---
name: Element.Delegation Tests
requires: [Core/Element.Delegation]
provides: [Element.Delegation.Tests]
...
*/
describe('Elements.Delegation', function(){

	// Only run this spec in browsers other than IE6-8 because they can't properly simulate bubbling events
	if (window.addEventListener) it('A parent Element should delegate a child element', function(){

		var callback = jasmine.createSpy('relay');

		var elements = {};

		elements.wrapper = new Element('div').inject(document.body);
		elements.child = new Element('div').inject(elements.wrapper);

		elements.wrapper.addEvent('click:relay(div)', callback);

		Syn.trigger('click', {}, elements.child);
		expect(callback).toHaveBeenCalled();

		for (var i in elements) $(elements[i]).destroy();

	});

});

/*
---
name: Element.Event.Pseudos.Keys Tests
requires: [More/Element.Event.Pseudos.Keys]
provides: [Element.Event.Pseudos.Keys.Tests]
...
*/
// Only run this spec in browsers other than IE6-8 because they can't properly simulate key events
if (window.addEventListener) describe('Element.Event.Pseudos.Keys', function(){

	it('keys: should fire events for keyboard key combinations', function(){

		var callback = jasmine.createSpy(),
			callback2 = jasmine.createSpy(),
			callback3 = jasmine.createSpy();

		document.body.addEvent('keydown:keys(shift+a)', callback);
		document.body.addEvent('keydown:keys(shift++)', callback2);
		document.body.addEvent('keydown:keys(+)', callback3);

		// shift+a
		Syn.type('[shift]a[shift-up]', document.body);

		expect(callback).toHaveBeenCalled();
		document.body.eliminate('$moo:keys-pressed');

		// shift++
		Syn.type('[shift]+[shift-up]', document.body);

		expect(callback2).toHaveBeenCalled();
		document.body.eliminate('$moo:keys-pressed');

		// +
		Syn.type('+', document.body);

		expect(callback3).toHaveBeenCalled();
		document.body.eliminate('$moo:keys-pressed');

	});

});

/*
---
name: Element.Event.Pseudos Tests
requires: [More/Element.Event.Pseudos, Core/Request.JSON]
provides: [Element.Event.Pseudos.Tests]
...
*/
describe('Element.Event.Pseudos', function(){

	it('tests the DOMEvent.definePseudo function', function(){

		var eventFn =  function(){
			return 'bar';
		},
		eventArgs = ['one', 'two', 'three'];

		DOMEvent.definePseudo('test', function(split, fn, args){
			expect({
				event: split.event,
				value: split.value,
				pseudo: split.pseudo,
				original: split.original
			}).toEqual({
				event: 'e',
				value: 'foo',
				pseudo: 'test',
				original: 'e:test(foo)'
			});
			expect(fn).toEqual(eventFn);
			expect(Array.from(args)).toEqual(eventArgs);
		});

		var element = new Element('div');
		element.addEvent('e:test(foo)', eventFn);
		element.fireEvent('e', eventArgs);

	});

	describe('pseudos', function(){

		it('once: should fire the event once', function(){
			var spy = jasmine.createSpy('click');
			var element = new Element('div');
			element.addEvent('click:once', spy);
			element.fireEvent('click');

			expect(spy.callCount).toEqual(1);
		});

	});

	// Test if Events.Pseudos is implemented in Fx.Tween and Request.JSON
	it('should test if Events.Pseudos is implemented in Fx.Tween and Request.JSON', function(){
		var reqComplete = jasmine.createSpy('requestComplete');
		var req = new Request.JSON().addEvent('complete:once', reqComplete);
		req.fireEvent('complete');
		expect(reqComplete).toHaveBeenCalled();
	});

});


/*
---
name: Element.Forms Tests
requires: [More/Element.Forms]
provides: [Element.Forms.Tests]
...
*/
describe('Element.Forms', function(){

	var input, selectList, multiselect, container;

	beforeEach(function(){

		container = new Element('div', {
			styles: {
				height: 1,
				overflow: "hidden"
			}
		}).inject($(document.body));

		input = new Element('input', {
			type: 'text',
			value: '0123456789'
		}).inject(container);

		textarea = new Element('textarea', {
			value: '0123456789'
		}).inject(container);

		selectList = new Element('select', {
		}).inject(container);
		(3).times(function(i){
			var opt = new Element('option', {
				text: i + '_txt'
			}).inject(selectList);
			if (i>0) opt.set('value', i+'_val');
		});

		multiselect = selectList.clone(true).inject(container);
		multiselect.set('multiple', true);

		radio = new Element('input', {
			type: 'radio',
			name: 'radio',
			value: 'radioValue1'
		}).inject(container);

		radio2 = new Element('input', {
			type: 'radio',
			name: 'radio',
			checked: true,
			value: 'radioValue2'
		}).inject(container);

		checkbox = new Element('input', {
			type: 'checkbox',
			name: 'checkbox',
			value: 'checkboxValue'
		}).inject(container);

	});

	afterEach(function(){
		container.destroy();
	});

	describe('Element.getTextInRange', function(){

		it('should get text in a specific range from an input', function(){
			expect(input.getTextInRange(2, 5)).toEqual('234');
		});

		it('should get a partial match on text in range where the range is outside the bounds of the text', function(){
			expect(input.getTextInRange(8,20)).toEqual('89');
		});

	});

	describe('Element.selectRange', function(){

		it('should select range of text in an input', function(){
			expect(input.selectRange(2,5).getSelectedRange()).toEqual({start: 2, end: 5});
		});

	});

	describe('Element.getSelectedText', function(){

		it('should return selected text in an input', function(){
			expect(input.selectRange(0,10).getSelectedText()).toEqual('0123456789');
		});

	});

	describe('Element.getSelectionStart', function(){

		it('should get the selection start', function(){
			expect(input.selectRange(2,5).getSelectionStart()).toEqual(2);
		});

	});

	describe('Element.getSelectionEnd', function(){

		it('should get the selection end', function(){
			expect(input.selectRange(2,5).getSelectionEnd()).toEqual(5);
		});

	});

	describe('Element.setCaretPosition, Element.getCaretPosition', function(){

		it('should set the caret position', function(){
			expect(input.setCaretPosition(3).getCaretPosition()).toEqual(3);
		});

	});

	describe('Element.getSelectionStart', function(){

		it('should compare the caret position to the selection start', function(){
			expect(input.setCaretPosition(3).getSelectionStart()).toEqual(3);
		});

	});

	describe('Element.insertAtCursor', function(){

		it('should insert at cursor', function(){
			expect(input.setCaretPosition(3).insertAtCursor('test').get('value')).toEqual('012test3456789');
		});

	});

	describe('Element.insertAroundCursor', function(){

		it('should insert around cursor', function(){
			expect(input.set('value', '0123456789').selectRange(2,5).insertAroundCursor({
				before: '{',
				after: '}'
			}).get('value')).toEqual('01{234}56789');
		});


		it('should insert around cursor w/o selection', function(){
			expect(input.set('value', '0123456789').setCaretPosition(2).insertAroundCursor({
				before: '{',
				after: '}',
				defaultMiddle: 'X'
			}).get('value')).toEqual('01{X}23456789');
		});

	});

});

/*
---
name: Element.Measure Tests
requires: [More/Element.Measure]
provides: [Element.Measure.Tests]
...
*/
describe('Element.Measure', function(){

	var div,
		parDiv;

	var createElement = function(id){
		return new Element('div', {
			id: id,
			styles: {
				width: 100,
				height: 100,
				margin: 2,
				padding: 3,
				border: '1px solid black',
				display: 'none',
				position: 'absolute'
			}
		});
	};

	window.addEvent('domready', function(){
		div = createElement('MeasureTest').inject(document.body);
		innerDiv = createElement('MeasureTestInner').inject(div);
	});

	it('should measure the width and height of the hidden element', function(){
		expect(div.getDimensions()).toEqual({width: 108, height: 108, x: 108, y: 108});
	});

	it('should measure the computed (total) size of an element', function(){
		expect(div.getDimensions({computeSize: true})).toEqual({
			'padding-top': 3,
			'border-top-width': 1,
			'padding-bottom': 3,
			'border-bottom-width': 1,
			'padding-left': 3,
			'border-left-width': 1,
			'padding-right': 3,
			'border-right-width': 1,
			'width': 100,
			'height': 100,
			'x': 100,
			'y': 100,
			'totalHeight': 108,
			'computedTop': 4,
			'computedBottom': 4,
			'totalWidth': 108,
			'computedLeft': 4,
			'computedRight': 4
		});
	});

	it('should measure the computed width of an element', function(){
		expect(div.getDimensions({computeSize: true, mode: 'horizontal'})).toEqual({
			'padding-left': 3,
			'border-left-width': 1,
			'padding-right': 3,
			'border-right-width': 1,
			'totalWidth': 108,
			'width': 100,
			'x': 100,
			'computedLeft': 4,
			'computedRight': 4
		});
	});

});

describe('Element.getComputedSize', function(){

	it('should get the Computed Size of an element even if height and width aren\'t explicity defined', function(){
		var element = new Element('ul', {
			'html': '<li><a href="#" title="">Foo Bar</a></li>'
		}).inject(document.body);

		var computedSize = element.getComputedSize();

		this.after(element.destroy.bind(element));

		expect(typeOf(computedSize.width)).toEqual('number');
		expect(typeOf(computedSize.height)).toEqual('number');
	});

});

/*
---
name: Element.Pin Tests
requires: [More/Element.Pin, Core/DomReady]
provides: [Element.Pin.Tests]
...
*/
describe("Element.Pin", function(){

	describe("togglePin", function(){

		it("should toggle the pinning of the element", function(){
			var div = new Element('div').inject(document.body);
			expect(div.togglePin().retrieve('pin:_pinned')).toEqual(true);
			expect(div.togglePin().retrieve('pin:_pinned')).toEqual(false);
			div.destroy();
		});

	});

	describe("pin", function(){

		var div;

		window.addEvent('domready', function(){
			div = new Element('div').inject(document.body);
		});

		it("should not toggle pin state if element's display is none", function(){
			div.setStyle('display', 'none');
			expect(div.pin().retrieve('pin:_pinned')).not.toEqual(true);
			div.setStyle('display', 'block');
			div.unpin();
		});

		it("should return the element", function(){
			expect(div.pin()).toEqual(div);
			div.setStyle('display', 'none');
			expect(div.pin()).toEqual(div);
			div.setStyle('display', 'block');
			div.unpin();
		});

		it("should update 'pin:_pinned' state on the element as true", function(){
			expect(div.pin().retrieve('pin:_pinned')).toEqual(true);
			div.unpin();
		});

		it("should store 'pin:_scrollFixer' on the element", function(){
			expect(typeOf(div.pin(true, true).retrieve('pin:_scrollFixer'))).toEqual('function');
			div.unpin();
		});

		it("should not change position of the element on the page", function(){
			var pos = div.setStyles({
				position: 'absolute',
				top: 50,
				left: 50
			}).getPosition();
			div.unpin();
			$(document.body).scrollTo('top');
			//does not test for ie6
			if (div.getStyle('position') == 'fixed') expect(div.pin().getPosition()).toEqual(pos);
			div.destroy();
		});

	});

	describe('unpin', function(){

		var div;

		beforeEach(function(){
			div = div || new Element('div').inject(document.body);
			div.pin(true, true);
		});

		it("should not toggle pin state if element's display is none", function(){
			div.setStyle('display', 'none');
			expect(div.unpin().retrieve('pin:_pinned')).toEqual(true);
			div.setStyle('display', 'block');
		});

		it("should exit if 'pin:_pinned' is falsy", function(){
			div.store('pin:_pinned', null);
			expect(div.unpin().retrieve('pin:_pinned')).not.toEqual(false);
		});

		it("should return the element", function(){
			expect(div.unpin()).toEqual(div);
			div.setStyle('display', 'none');
			expect(div.unpin()).toEqual(div);
			div.setStyle('display', 'block');
		});

		it("should update 'pin:_pinned' state on the element to false", function(){
			expect(div.unpin().retrieve('pin:_pinned')).toEqual(false);
		});

		it("should remove 'pin:_scrollFixer' on the element if present", function(){
			expect(div.unpin().retrieve('pin:_scrollFixer')).toEqual(null);
			div.destroy();
		});

	});

	describe("_scrollFixer", function(){

		var div;

		window.addEvent('domready', function(){
			div = new Element('div').inject(document.body);
		});

		it("should not setStyles if element's 'pin:_pinned' is false", function(){
			div.pin(true, true);
			div.store('pin:_pinned', false);
			spyOn(div, 'setStyle');
			div.retrieve('pin:_scrollFixer')();
			expect(div.setStyle).not.toHaveBeenCalled();
		});

		it("should setStyles if element is pinned", function(){
			spyOn(div, 'setStyle');
			div.pin(true, true).retrieve('pin:_scrollFixer')();
			expect(div.setStyle).toHaveBeenCalled();
		});

	});

});

/*
---
name: Element.Position Tests
requires: [More/Element.Position]
provides: [Element.Position.Tests]
...
*/
describe("Element.Position", function(){

	var element,
		options;

		beforeEach(function(){
			window.scroll(0,0); //calculations are based off of zero scroll unless otherwise set
			options = {};
			element = new Element('div').inject(document.body);
		});

		afterEach(function(){
			element.destroy();
		});

		describe("element.position", function(){

			describe('options.returnPos', function(){

				it('should return the element when options.returnPos is not present', function(){
					expect(element.position(options)).toEqual(element);
				});

				it('should set the element style when options.returnPos is not present', function(){
					expect(element.position(options).get('style')).not.toEqual('');
				});

				it('should return a position object if options.returnPos is present', function(){
					options.returnPos = true;
					expect(typeOf(element.position(options))).toEqual('object');
				});

				it('should return an object with left, top, and absolute properties when  options.returnPos is present', function(){
					options.returnPos = true;
					var position = element.position(options);
					expect(position.left).not.toEqual(null);
					expect(position.top).not.toEqual(null);
				});

			});

			describe('original', function(){

				it('should call original position method when options x y values are present', function(){
					options.x = 0;
					options.y = 0;
					spyOn(element, 'calculatePosition');
					spyOn(element, 'position');
					element.position(options);
					expect(element.calculatePosition).not.toHaveBeenCalled();
					expect(element.position).toHaveBeenCalled();
				});

			});

			describe('relativeTo', function(){

				var container;

				function setup(position, element, options){
					container = new Element('div', {
						'styles': {
							'position': position,
							'width': 100,
							'height': 100,
							'top': 0,
							'left': 0
						}
					}).inject(document.body, 'top');

					element.setStyles({
						'width': 20,
						'height': 20
					});

					options.ignoreMargins = true;
					options.ignoreScroll = true;
					options.relativeTo = container;
					options.allowNegative = true;
				}

				function testVerbage(placement, edge, blockPosition, where){
					return 'should return coordinates of element at ' + placement +
						' when options position=' + placement +
						' and edge =' + edge +
						' and container is ' + blockPosition +
						' and element placement is' + where;
				}

				var blockPositions = ['fixed', 'absolute'],
					wheres = ['after', 'top'],
					edges = ['centerCenter', 'leftTop', 'bottomRight'],
					placements = ['leftTop', 'leftCenter', 'leftBottom', 'centerTop', 'centerCenter', 'centerBottom', 'rightTop', 'rightCenter', 'rightBottom'];

				var expectedValues = {
					'centerCenter': [-10, 40, 90],
					'leftTop': [0, 50, 100],
					'bottomRight': [-20, 30, 80]
				};

				afterEach(function(){
					container.dispose();
				});

				blockPositions.each(function(blockPosition){

					wheres.each(function(where){

						edges.each(function(edge){

							var i = 0,
								j = 0;

							placements.each(function(placement){

								it(testVerbage(placement, edge, blockPosition, where), function(){
									setup(blockPosition, element, options);
									element.inject(container, where);
									options.position = placement;
									options.relFixedPosition = blockPosition == 'fixed';
									options.edge = edge;
									var position = element.calculatePosition(options);
									expect(position.top).toEqual(expectedValues[edge][j]);
									expect(position.left).toEqual(expectedValues[edge][i]);
									if (j++ == 2){
										if( i++ == 2) i = 0;
										j = 0;
									}
								});

							});

						});

					});

				});

				describe('minimum/maximum', function(){

					it("should return coordinates relative to a minimum x, y value when a minimum is supplied", function(){
						setup(position, element, options);
						element.inject(container);
						options.position = 'topLeft';
						options.minimum = {x: 15, y: 15};
						var position = element.calculatePosition(options);
						expect(position.top).toEqual(15);
						expect(position.left).toEqual(15);
					});

					it("should return coordinates relative to a maximum x, y value when a maximum is supplied", function(){
						setup(position, element, options);
						element.inject(container);
						options.position = "bottomRight";
						options.maximum = {x: 70, y: 70};
						var position = element.calculatePosition(options);
						expect(position.top).toEqual(70);
						expect(position.left).toEqual(70);
					});

				});

				it('should return the correct position of an element not positioned with css', function(){
					var foo = new Element('div').adopt(new Element('div', {styles: {width: 10}})).inject(document.body);
					expect(element.position({returnPos: true, relativeTo: document.body}).left).not.toEqual(0);
					foo.destroy();
				});

			});

	});

});

/*
---
name: Element.Shortcuts Tests
requires: [More/Element.Shortcuts]
provides: [Element.Shortcuts.Tests]
...
*/

(function(){

	var elements;
	window.addEvent('domready', function(){

		elements = new Elements([
			new Element('div', {
				styles: {
					display: 'none'
				}
			}),
			new Element('div', {
				styles: {
					display: 'block'
				}
			}),
			new Element('div', {
				styles: {
					width: 0,
					height: 0,
					overflow: 'hidden'
				}
			}),
			new Element('div', {
				'class': 'testClass'
			})
		]);

		elements.inject(new Element('div').inject(document.body));

	});
	describe('Element.isDisplayed', function(){

		it('element display should be false', function(){
			expect(elements[0].isDisplayed()).toBeFalsy();
		});


		it('element display should be true', function(){
			expect(elements[1].isDisplayed()).toBeTruthy();
		});

	});

	describe('Element.isVisible', function(){

		it('is the element visible (width == 0 and height == 0)', function(){
			expect(elements[2].isVisible()).toBeFalsy();
		});

	});

	describe('Element.toggle', function(){

		it('toggle the display of an element', function(){
			expect(elements[1].hide().toggle().isDisplayed()).toBeTruthy();
		});

	});

	describe('Element.hide', function(){

		it('hide an element', function(){
			expect(elements[1].hide().isDisplayed()).toBeFalsy();
		});

	});

	describe('Element.show', function(){

		it('show the element', function(){
			expect(elements[0].show().isDisplayed()).toBeTruthy();
		});

	});

	describe('Element.swapClass', function(){

		it('should add and remove a clas to the class attribute', function(){
			var el = elements[3].swapClass('testClass', 'newClass');
			expect(el.hasClass('newClass') && !el.hasClass('testClass')).toBeTruthy();
		});

	});

})();

/*
---
name: Elements.From Tests
requires: [More/Elements.From]
provides: [Elements.From.Tests]
...
*/
describe('Elements.From', function(){

	it('should return a group of elements', function(){
		var str = '<p><b>foo</b></p><i>bar</i>';
		var div = new Element('div');
		expect(div.adopt(Elements.from(str)).get('html').toLowerCase().trim()).toEqual(str);
	});

	it('should return a group of table elements', function(){
		var str = '<tr><td>foo</td></tr>';
		var tbody = new Element('tbody').inject(new Element('table')).adopt(Elements.from(str));
		expect(tbody.get('html').toLowerCase().replace(/\s+/g, '').trim()).toEqual(str);
	});

	it('should also return a group of table elements', function(){
		var str = '<tr><td>foo</td></tr>';
		var commented = ' <!-- comments --> ' + str;
		var tbody = new Element('tbody').inject(new Element('table')).adopt(Elements.from(commented));
		expect(tbody.get('html').toLowerCase().replace(/\s+/g, '').trim()).toEqual(str);
	});

});

/*
---
name: Form.Validator Tests
requires: [More/Form.Validator]
provides: [Form.Validator.Tests]
...
*/
describe('Form.Validator', function(){

	describe('Element.Properties.validatorProps', function(){

		it('should get the properties from a JSON string in the class attribute', function(){
			var element = new Element('input', {'class': 'minLength:10'});
			expect(element.get('validatorProps')).toEqual({minLength: 10});
		});

		it('should get the properties from a JSON string in the data-validator-properties attribute', function(){
			var element = new Element('input', {'data-validator-properties': '{minLength:10}'});
			expect(element.get('validatorProps')).toEqual({minLength: 10});
		});

		it('should get the validator properties from a JSON string in the validatorProps attribute', function(){
			var element = new Element('input').setProperty('validatorProps', '{minLength: 10, maxLength:20}');
			expect(element.get('validatorProps')).toEqual({minLength: 10, maxLength: 20});
		});
        
		it('should get the properties in the class attribute from a new added Validator', function (){

			var prop;
			Form.Validator.add('validate-string-fail', {
				errorMsg: function (element, props){
					return Form.Validator.getMsg('required');
				},
				test: function (element, props){
					prop = props.mooCustom;
					return false;
				}
			});

			var form = new Element('form').adopt(
			new Element('input', {
				'type': 'text',
				'name': 'foo',
				'class': "validate-string-fail mooCustom:'Hello-World!'"
			})).inject($(document.body));

			new Form.Validator.Inline(form);
			form.validate();
			expect(prop).toEqual('Hello-World!');
			form.dispose();
		});

	});

	describe('Element.Properties.validator', function(){

		it('should set Form.Validator options', function(){
			var element = new Element('form').set('validator', {
				useTitles: true
			});
			expect(element.retrieve('validator').options.useTitles).toEqual(true);
		});

		it('should get a Form.Validator instance', function(){
			var element = new Element('form'),
				fv1 = element.get('validator'),
				fv2 = element.get('validator');
			expect(instanceOf(fv1, Form.Validator)).toEqual(true);
			expect(fv2).toEqual(fv1);
		});

	});


	describe('Element.validate method', function(){
		it('should return false if the form is not valid', function(){
			var form = new Element('form').adopt(
				new Element('input', {
					'class': 'minLength:10',
					value: 'toShort'
				})
			);
			expect(form.validate({ignoreHidden: false})).toEqual(false);
		});
	});

	describe('Warnings', function(){

		it('should still validate the form when there is a warning', function(){
			var form = new Element('form').adopt(
				new Element('input', {
					'class': 'warn-required'
				})
			);
			expect(form.validate({ignoreHidden: false})).toEqual(true);
		});
	
	});

	describe('onElementPass', function(){

		var form, select;
		beforeEach(function(){
			form = new Element('form', {
				action: '#'
			}).adopt(
				select = new Element('select', {
					'class': 'minLength:2'
				}).adopt(
					[1, 2, 3].map(function(item){
						return new Element('option', {html: item, value: item});
					})
				)
			);
		});

		afterEach(function(){
			form = select = null;
		});

		it('should pass the field as an argument', function(){
			var spy = jasmine.createSpy();
			new Form.Validator(form, {
				onElementPass: spy
			}).validate();
			expect(spy).toHaveBeenCalledWith(select);
		});

	});

	describe('Validators', function(){

		getValidator = Form.Validator.getValidator.bind(Form.Validator);

		function createInput(value){
			return new Element('input', {
				value: value
			});
		}

		describe('required', function(){

			var validator = getValidator('required');

			it('should return false for fields with no value', function(){
				expect(validator.test(createInput(null))).toEqual(false);
			});

			it('should return true for fields with a value', function(){
				expect(validator.test(createInput('foo'))).toEqual(true);
			});

		});

		describe('length', function(){

			var validator = getValidator('length');

			it('should return false for fields with a length less than the specified length', function(){
				expect(validator.test(createInput('12345'), {length: 10})).toEqual(false);
			});

			it('should return true for fields with the exact length', function(){
				expect(validator.test(createInput('12345'), {length: 5})).toEqual(true);
			});

		});

		describe('minLength', function(){

			var validator = getValidator('minLength');

			function minLength(value){
				return { minLength: value };
			}

			it('should return false for fields with a length less than the specified minLength', function(){
				expect(validator.test(createInput('12345'), minLength(10))).toEqual(false);
			});

			it('should return true for fields with a length greater than the specified minLength', function(){
				expect(validator.test(createInput('12345'), minLength(3))).toEqual(true);
			});

			it('should return true for fields with a length equal to the specified minLength', function(){
				expect(validator.test(createInput('12345'), minLength(5))).toEqual(true);
			});

		});

		describe('maxLength', function(){

			var validator = getValidator('maxLength');

			function maxLength(value){
				return { maxLength: value };
			}

			it('should return false for fields with a length greater than the specified maxLength', function(){
				expect(validator.test(createInput('12345'), maxLength(3))).toEqual(false);
			});

			it('should return true for fields with a length less than the specified maxLength', function(){
				expect(validator.test(createInput('12345'), maxLength(10))).toEqual(true);
			});

			it('should return true for fields with a length equal to the specified maxLength', function(){
				expect(validator.test(createInput('12345'), maxLength(5))).toEqual(true);
			});

		});

		describe('validate-integer', function(){

			var validator = getValidator('validate-integer');

			it('should return false for fields whose value is not an integer', function(){
				expect(validator.test(createInput('a'))).toEqual(false);
				expect(validator.test(createInput('4.1'))).toEqual(false);
				expect(validator.test(createInput('1a'))).toEqual(false);
			});

			it('should return true for fields whose value is an integer', function(){
				expect(validator.test(createInput(5))).toEqual(true);
			});

		});

		describe('validate-numeric', function(){

			var validator = getValidator('validate-numeric');

			it('should return false for fields whose value is not a number', function(){
				expect(validator.test(createInput('a'))).toEqual(false);
				expect(validator.test(createInput('1a'))).toEqual(false);
			});

			it('should return true for fields whose value is a number', function(){
				expect(validator.test(createInput(5))).toEqual(true);
				expect(validator.test(createInput('4.1'))).toEqual(true);
			});

		});

		describe('validate-digits', function(){

			var validator = getValidator('validate-digits');

			it('should return false for fields whose value is not a digit', function(){
				expect(validator.test(createInput('a'))).toEqual(false);
				expect(validator.test(createInput('1a'))).toEqual(false);
			});

			it('should return true for fields whose value is a digit', function(){
				expect(validator.test(createInput(5))).toEqual(true);
				expect(validator.test(createInput('4.1'))).toEqual(true);
				});

			it('should return true for fields which contain punctuation and spaces', function(){
				expect(validator.test(createInput('000-000-0000'))).toEqual(true);
				expect(validator.test(createInput('000 000 0000'))).toEqual(true);
				expect(validator.test(createInput('000.000.0000'))).toEqual(true);
				expect(validator.test(createInput('000#000#0000'))).toEqual(true);
				expect(validator.test(createInput('000:000:0000'))).toEqual(true);
				expect(validator.test(createInput('000+000+0000'))).toEqual(true);
				expect(validator.test(createInput('#(000)-000-0000:0000'))).toEqual(true);
			});

		});

		describe('validate-alpha', function(){

			var validator = getValidator('validate-alpha');

			it('should return false for fields whose value contains anything that is not a letter', function(){
				expect(validator.test(createInput('Mr. Foo'))).toEqual(false);
				expect(validator.test(createInput('Jacob The 2nd'))).toEqual(false);
				expect(validator.test(createInput(123))).toEqual(false);
			});

			it('should return true for fields whose value only contains letters', function(){
				expect(validator.test(createInput("CamelFoo"))).toEqual(true);
			});

		});

		describe('validate-alphanum', function(){

			var validator = getValidator('validate-alphanum');

			it('should return false for fields whose value contains anything that\s not a letter or number', function(){
				expect(validator.test(createInput('Mr. Foo'))).toEqual(false);
				expect(validator.test(createInput('Jacob The 2nd'))).toEqual(false);
			});

			it('should return true for fields whose value only contains letters and numbers', function(){
				expect(validator.test(createInput(123))).toEqual(true);
				expect(validator.test(createInput('CamelFoo222'))).toEqual(true);
			});

		});

		describe('validate-date', function(){

			var validator = getValidator('validate-date');

			beforeEach(function(){
				Locale.use('en-US');
			});

			it('should return false for fields whose value is not a date', function(){
				expect(validator.test(createInput('Mr. Foo'))).toEqual(false);
				expect(validator.test(createInput('blah 12, 1000'))).toEqual(false);
				expect(validator.test(createInput('Boo 12'))).toEqual(false);
			});

			it('should return false, instead of Type Error, when passed a empty string', function(){
				expect(validator.test(createInput('    '))).toBeFalsy()
			});

			it('should return true for fields whose value parses to a date', function(){
				expect(validator.test(createInput('Nov 12'))).toEqual(true);
				expect(validator.test(createInput('10-10-2000'))).toEqual(true);
				expect(validator.test(createInput('Nov 10, 2010'))).toEqual(true);
			});

		});

		describe('validate-email', function(){

			var validator = getValidator('validate-email');

			it('should return false for fields whose value is not a valid email address', function(){
				expect(validator.test(createInput('foobar@gmail..com'))).toEqual(false);
				expect(validator.test(createInput('foobar12312_fd@@@@gmail.com'))).toEqual(false);
				expect(validator.test(createInput('@#@#@(*&##(*@gmail.com'))).toEqual(false);
			});

			it('should return true for fields whose value is a valid email address', function(){
				expect(validator.test(createInput('foo#bar@gmail.com'))).toEqual(true);
				expect(validator.test(createInput('foo.bar@gmail.com'))).toEqual(true);
				expect(validator.test(createInput('foobar@gmail.com'))).toEqual(true);
				expect(validator.test(createInput('foobar@gmail.asdf.com'))).toEqual(true);
				expect(validator.test(createInput('foobar12312_fd@gmail.com'))).toEqual(true);
			});

		});

		describe('validate-url', function(){

			var validator = getValidator('validate-url');

			it('should return false for fields whose value is not a url', function(){
				expect(validator.test(createInput('asdfasdfasdfasdf'))).toEqual(false);
				expect(validator.test(createInput('http12341:3143'))).toEqual(false);
			});

			it('should return true for fields whose value is a valid url', function(){
				expect(validator.test(createInput('https://www.foo.org'))).toEqual(true);
				expect(validator.test(createInput('https://foo.org/asdf/asdf'))).toEqual(true);
				expect(validator.test(createInput('https://foo.org/asdf/asdf.png'))).toEqual(true);
				expect(validator.test(createInput('https://foo.org'))).toEqual(true);
				expect(validator.test(createInput('https://foo.org:8000'))).toEqual(true);
				expect(validator.test(createInput('https://foo.org:8000?asdfasd'))).toEqual(true);
				expect(validator.test(createInput('https://foo.org:8000?asdfasd&bar=asdf'))).toEqual(true);
			});

		});

		describe('validate-currency-dollar', function(){

			var validator = getValidator('validate-currency-dollar');

			it('should return false for fields whose value is not currency', function(){
				expect(validator.test(createInput('$$100000.00'))).toEqual(false);
				expect(validator.test(createInput('$ 100000.00'))).toEqual(false);
				expect(validator.test(createInput('$ 1000,00.00'))).toEqual(false);
				expect(validator.test(createInput('$100000 bucks'))).toEqual(false);
			});

			it('should return true for fields whose value is currency', function(){
				expect(validator.test(createInput('$100,000.00'))).toEqual(true);
				expect(validator.test(createInput('$100000.00'))).toEqual(true);
				expect(validator.test(createInput('$100000'))).toEqual(true);
				expect(validator.test(createInput('$1000.00'))).toEqual(true);
				expect(validator.test(createInput('$0.00'))).toEqual(true);
				expect(validator.test(createInput('$.00'))).toEqual(true);

				expect(validator.test(createInput('100,000.00'))).toEqual(true);
				expect(validator.test(createInput('100000.00'))).toEqual(true);
				expect(validator.test(createInput('100000'))).toEqual(true);
				expect(validator.test(createInput('1000.00'))).toEqual(true);
				expect(validator.test(createInput('0.00'))).toEqual(true);
				expect(validator.test(createInput('.00'))).toEqual(true);
			});

		});

		describe('validate-one-required', function(){

			var validator = getValidator('validate-one-required'),
				collectionWithValues = new Element('div').adopt(
					['hi', '', '', ''].map(function(value){
						return createInput(value);
					})
				),
				collectionWithoutValues = new Element('div').adopt(
					['', '', '', ''].map(function(value){
						return createInput(value);
					})
				);

			it('should return true if atleast one of an elements siblings have a value', function(){
				expect(validator.test(collectionWithValues.getChildren()[2])).toEqual(true);
				this.after(collectionWithValues.destroy.bind(collectionWithValues));
			});

			it('should return false if none of an elements siblings have a value', function(){
				expect(validator.test(collectionWithoutValues.getChildren()[2])).toEqual(false);
				this.after(collectionWithoutValues.destroy.bind(collectionWithoutValues));
			});

		});

	});

});

/*
---
name: Fx.Reveal Tests
requires: [More/Fx.Reveal]
provides: [Fx.Reveal.Tests]
...
*/
describe('Fx.Reveal', function(){

	describe('set', function(){

		it('it should not remove css styling', function(){
			var el = new Element('div', { 
				styles: {
					display: 'none'
				}
			});
			el.set('reveal', {});
			expect(el.getStyle('display')).toEqual('none');
		});

	});

});

/*
---
name: Fx.Slide
requires: [Core/Fx, Core/Element.Style, MooTools.More]
provides: [Fx.Slide]
...
*/
describe('Fx.Slide', function(){

	it('should reset the height when the resetHeight option is set to true by element.set', function(){
		var div = new Element('div', {text: 'moo'}).inject(document.body);
		div.set('slide', {
			resetHeight: true,
			duration: 20
		});
		var fx = div.get('slide');
		fx.hide().slideIn();

		waits(100);

		runs(function(){
			expect(fx.wrapper.style.height).toEqual('');
			fx.wrapper.destroy();
		});
	});

});
/*
---
name: HtmlTable.Select Tests
requires: [More/HtmlTable.Select]
provides: [HtmlTable.Select.Tests]
...
*/
describe('HtmlTable.Select', function(){

	var getTable = function(){
		return new HtmlTable({
			selectable: true,
			useKeyboard: true,
			rows: [[0],[1],[2]]
		});
	};

	it('should clear selections when emptying a table', function(){
		var table = getTable();

		var row = table.body.getChildren()[0];
		table.selectRow(row);
		table.empty();
		expect(table.isSelected(row)).toEqual(false);
	});


	it('should return the selected row(s)', function(){
		var table = getTable();

		var rows = table.body.getChildren();
		table.selectRow(rows[0]);
		var selected = table.getSelected();
		expect(selected[0]).toEqual(rows[0]);
		expect(selected.length).toEqual(1);

		table.selectRow(rows[1]);
		selected = table.getSelected();
		expect(selected[1]).toEqual(rows[1]);
		expect(selected.length).toEqual(2);
	});


	it('should skip hidden rows when selecting rows', function(){
		var table = getTable();

		var rows = table.body.getChildren();
		rows[1].setStyle('display', 'none');
		table.selectRange(rows[0], rows[2]);
		var selected = table.getSelected();
		expect(selected.length).toEqual(2);
		expect(selected[0]).toEqual(rows[0]);
		expect(selected[1]).toEqual(rows[2]);
	});

	it('should select all and select none', function(){
		var table = getTable();
		var rows = table.body.getChildren();

		table.selectAll();
		var selected = table.getSelected();

		expect(selected.length).toEqual(3);
		expect(selected[0]).toEqual(rows[0]);
		expect(selected[1]).toEqual(rows[1]);
		expect(selected[2]).toEqual(rows[2]);
		expect(selected[0].hasClass('table-tr-selected')).toBeTruthy();

		table.selectNone();
		selected = table.getSelected();
		expect(selected.length).toEqual(0);
		expect(rows[0].hasClass('table-tr-selected')).toBeFalsy();
	});


	it('should serialize the state of the table', function(){
		var SelectableTable = new HtmlTable({
			selectable: true,
			useKeyboard: false,
			rows: [[0],[1],[2]]
		});

		SelectableTable.selectRow(SelectableTable.body.getChildren()[0]);
		SelectableTable.selectRow(SelectableTable.body.getChildren()[2]);
		var state = SelectableTable.serialize();
		expect(state).toEqual({selectedRows: [0, 2]});
	});

	it('should restore the state of the table', function(){
		var SelectableTable = new HtmlTable({
			selectable: true,
			useKeyboard: false,
			rows: [[0],[1],[2]]
		});
		SelectableTable.restore({selectedRows: [0, 2]});
		expect(SelectableTable.getSelected()).toEqual($$([SelectableTable.body.getChildren()[0], SelectableTable.body.getChildren()[2]]));
	});


	if (window.addEventListener) it('should allow keyboard events to change selection', function(){
		var table = getTable().inject(document.body);

		var rows = table.body.getChildren();

		Syn.type('[down]', table.toElement());

		expect(table.isSelected(rows[0])).toEqual(true);
		Syn.type('[down]', table.toElement());
		expect(table.isSelected(rows[0])).toEqual(false);
		expect(table.isSelected(rows[1])).toEqual(true);
		Syn.type('[shift][up]', table.toElement());
		expect(table.isSelected(rows[0])).toEqual(true);
		expect(table.isSelected(rows[1])).toEqual(true);
		table.dispose();
	});

	if (window.addEventListener) it('should enable a table\'s keyboard', function(){
		var table1 = getTable().inject(document.body);
		var table2 = getTable().inject(document.body);
		table1.toElement().id = 'one';
		table2.toElement().id = 'two';

		var t1rows = table1.body.getChildren();
		var t2rows = table2.body.getChildren();

		Syn.type('[down]', table2.toElement());

		expect(table2.isSelected(t2rows[0])).toEqual(true);

		//can't get the click to work for some reason...
		//Syn.click({}, table1.toElement());
		//works fine if I activate it manually
		table1.keyboard.activate();

		Syn.type('[down]', table1.toElement());
		expect(table1.isSelected(t1rows[0])).toEqual(true);

		//and this should be deactivated, so no change
		Syn.type('[down]', table2.toElement());
		expect(table2.isSelected(t2rows[0])).toEqual(true);

		table1.dispose();
		table2.dispose();
	});

  it('should not step on prior this.bind declarations', function () {
    var table = new HtmlTable();
    expect(table.bound.clickRow).not.toEqual(null);
    expect(table.bound.mouseleave).not.toEqual(null);
    expect(table.bound.activateKeyboard).not.toEqual(null);
  });

});

/*
---
name: HtmlTable.Sort Tests
requires: [More/HtmlTable.Sort]
provides: [HtmlTable.Sort.Tests]
...
*/
describe('HtmlTable.Sort', function(){

  it('should not step on prior this.bind declarations', function () {
    var table = new HtmlTable();
    expect(table.bound.headClick).not.toEqual(null);
  });

	describe('HtmlTable.Parsers', function(){

		var sortedTable = function(type, data){
			var table = new HtmlTable({
				sortable: true,
				headers: ['col'],
				parsers: type ? [type] : [],
				rows: data.map(function(item){return [item];})
			});

			return Array.map(table.sort(0, false).body.rows, function(item){
				return item.cells[0].get('text') || item.cells[0].getElement('input').get('value');
			});
		};

		describe('date', function(){

			it('should sort on date', function(){
				expect(sortedTable('date', ['2/4/10', '3/4/10', '1/2/08'])).toEqual(['1/2/08', '2/4/10', '3/4/10']);
			});

			it('should accept multiple date types', function(){
				expect(sortedTable('date', ['Jan 5 2010', '01/08/2010', '1/2/08'])).toEqual(['1/2/08', 'Jan 5 2010', '01/08/2010']);
			});

		});

		describe('input-', function(){

			var data = [
				new Element('input', {type: 'checkbox', checked: false, value: 'd'}),
				new Element('input', {type: 'checkbox', checked: true, value: 'a'}),
				new Element('input', {type: 'checkbox', checked: false, value: 'c'}),
				new Element('input', {type: 'checkbox', checked: true, value: 'b'})
			];

			describe('input-checked', function(){

				it('should sort by checked inputs', function(){
					var result = sortedTable('input-checked', data);
					expect(result[0]).not.toEqual('d');
					expect(result[0]).not.toEqual('c');
					expect(result[3]).not.toEqual('b');
					expect(result[3]).not.toEqual('a');
				});

			});

			describe('input-value', function(){

				it('should sort by input value', function(){
					expect(sortedTable('input-value', data)).toEqual(['a', 'b', 'c', 'd']);
				});

			});

		});

		describe('number', function(){

			it('should sort a list numerically', function(){
				expect(sortedTable('number', [3, 1, 2])).toEqual(['1', '2', '3']);
				expect(sortedTable('number', [3, 1, 12, 2])).toEqual(['1', '2', '3', '12']);
			});

			it('should accept numbers as strings', function(){
				expect(sortedTable('number', ['3', '1', 2])).toEqual(['1', '2', '3']);
			});

			it('should not sort floats according to value', function(){
				expect(sortedTable('number', ['.03', '1', '.2'])).not.toEqual(['.03', '.2', '1']);
			});

		});

		describe('numberLax', function(){

			it('should sort a alphanumerical list numerically', function(){
				expect(sortedTable('number', ['12c', '1a', '4b'])).toEqual(['1a', '4b', '12c']);
			});

		});

		describe('float', function(){

			it('should correctly sort floats according to value', function(){
				expect(sortedTable('float', ['1', '.03', '.2'])).toEqual(['.03', '.2', '1']);
			});

			it('should correctly sort floats in scientific notation according to value', function(){
				expect(sortedTable(false, [1.3e-10, 1.1, 1, 2])).toEqual(['1.3e-10', '1', '1.1', '2']);
				expect(sortedTable(false, [1.3e100, 1.2e+100, 1.3e-10, 1.1, 1, 2])).toEqual(['1.3e-10', '1', '1.1', '2', '1.2e+100', '1.3e+100']);
			});

			it('should sort by float when autodetecting a mix of floats and integers are present', function(){
				expect(sortedTable(false, [1.3, 1.2, 1.1, 1, 2])).toEqual(['1', '1.1', '1.2', '1.3', '2']);
			});

		});

		describe('floatLax', function(){

			it('should correctly sort alpha-floats according to value', function(){
				expect(sortedTable('float', ['.2b', '1c', '.03a'])).toEqual(['.03a', '.2b', '1c']);
			});

		});

		describe('string', function(){

			it('should sort a list alphabetically', function(){
				expect(sortedTable('string', ['a', 'c', 'b'])).toEqual(['a', 'b', 'c']);
			});

			it('should not be case sensitive', function(){
				expect(sortedTable('string', ['A', 'C', 'b'])).toEqual(['A', 'b', 'C']);
			});

			it('should sort a list of numbers alphabetically', function(){
				expect(sortedTable('string', [1, 2, 3, 12])).toEqual(['1', '12', '2', '3']);
			});

		});

		describe('title', function(){

			it('should sort a list alphabetically by title', function(){
				var data = [
					new Element('div', {title: 'b', text: 'b'}),
					new Element('div', {title: 'a', text: 'a'}),
					new Element('div', {title: 'c', text: 'c'})
				];
				expect(sortedTable('string', data)).toEqual(['a', 'b', 'c']);
			});

		});

	});

	describe('serialize/deserialize', function(){

		it('should serialize the sorted state of a table', function(){
			var table = new HtmlTable({
				sortable: true,
				headers: ['col'],
				parsers: ['number'],
				rows: [[1],[0],[2]]
			});

			table.sort(0, false);
			expect(table.serialize()).toEqual({sortIndex: 0, sortReverse: false});
		});

		it('should allow a custom sort function', function(){
			var table = new HtmlTable({
				sortable: true,
				headers: ['col'],
				rows: [
					['cccc'],
					['bb'],
					['aaa']
				]
			});

			function customSort(a, b) { // sort by length of string
				return a.value.length > b.value.length ? 1: -1;
			}

			table.sort(0, false, false, customSort);
			var values = Array.map(table.body.rows, function(item){
				return item.cells[0].get('text');
			});
			expect(values).toEqual(["bb", "aaa", "cccc"]);
		});

		it('should restore the sorted state of a table', function(){
			var table = new HtmlTable({
				sortable: true,
				headers: ['col'],
				parsers: ['number'],
				rows: [[1],[0],[2]]
			});
			table.restore({sortIndex: 0, sortReverse: false});

			var order = Array.map(table.body.rows, function(item){
				return item.cells[0].get('text');
			});

			expect(order).toEqual(['0','1','2']);
		});


	});
});

/*
---
name: HtmlTable.Zebra
requires: [HtmlTable, Element.Shortcuts, Class.refactor]
provides: [HtmlTable.Zebra]
...
*/
describe('HtmlTable.Zebra', function(){

	var getTable = function(){
		return new HtmlTable({
			rows: [[0],[1],[2]]
		});
	};

	it('should alternate the zebra class on/off', function(){
		var table = getTable();
		var rows = table.body.getChildren();
		expect(rows[0].hasClass('table-tr-odd')).toBeTruthy();
		expect(rows[1].hasClass('table-tr-odd')).toBeFalsy();
		expect(rows[2].hasClass('table-tr-odd')).toBeTruthy();
	});

	it('should update the zebras on row add/remove', function(){
		var table = getTable();
		table.push([3]);
		table.push([4]);
		var rows = table.body.getChildren();
		expect(rows[3].hasClass('table-tr-odd')).toBeFalsy();
		expect(rows[4].hasClass('table-tr-odd')).toBeTruthy();
		
		rows[3].dispose();
		table.updateZebras();
		expect(rows[3].hasClass('table-tr-odd')).toBeFalsy();
	});

	it('should ignore hidden rows for zebra classes', function(){
		var table = getTable();
		var rows = table.body.getChildren();
		rows[1].setStyle('display','none');
		table.updateZebras();
		expect(rows[0].hasClass('table-tr-odd')).toBeTruthy();
		expect(rows[2].hasClass('table-tr-odd')).toBeFalsy();
	});

});

/*
---
name: HtmlTable Tests
requires: [More/HtmlTable]
provides: [HtmlTable.Tests]
...
*/
describe('HtmlTable', function(){

	it('should create a new HtmlTable instance', function(){

		var properties = {
			border: '1',
			cellspacing: '2',
			cellpadding: '3',
			'class': 'simple-table'
		};

		var t = new HtmlTable({
			properties: properties,
			headers: ['fruit', 'colors'],
			footers: ['fruit', 'colors'],
			rows: [
				['lemon', 'yellow'],
				['apple', 'red']
			]
		});

		expect(t.thead.getElements('th').length).toEqual(2);
		expect(t.body.getElements('td').length).toEqual(4);
		expect(t.body.rows.length).toEqual(2);

		expect($(t).get('border', 'cellspacing', 'cellpadding', 'class')).toEqual(properties);

	});

	describe('HtmlTable:push', function(){
		var t = new HtmlTable(),
			tds;

		it('should push an multidimensional array', function(){
			t.push([
				'apple',
				[
					new Element('span', {'html': 'red'}),
					new Element('span', {'html': '(green)'})
				]
			]);

			tds = t.body.rows[0].getElements('td');
			expect(tds.length).toEqual(2);
			expect(tds[0].get('text')).toEqual('apple');
			expect(tds[1].get('text')).toEqual('red(green)');
		});

		it('should push a simple array with text', function(){
			t.push(['lemon', 'yellow']);
			tds = t.body.rows[1].getElements('td');
			expect(tds[0].get('text')).toEqual('lemon');
			expect(tds[1].get('text')).toEqual('yellow');
		});

		it('should push an array with options and properties', function(){
			t.push([{
					content: 'grapes',
					properties: {'class': 'someClass'}
				},
				'purple'
			]);
			tds = t.body.rows[2].getElements('td');
			expect(tds[0].get('text', 'class')).toEqual({
				text: 'grapes',
				'class': 'someClass'
			});
			expect(tds[1].get('text')).toEqual('purple');
		});

		it('should complement the spanned row with a new td', function(){
			t.push(['green']);
			expect(t.body.rows[3].getElements('td').length).toEqual(1);
		});

		it('should push an tr element', function(){
			var tr = new Element('tr').adopt(
				new Element('td'),
				new Element('td')
			);
			t.push(tr);
			expect(t.body.rows[4]).toEqual(tr);
		});

		it('should return an object {tr: ..., tds: ...}', function(){
			var value = t.push(['banana', 'yellow']);
			expect(value.tr.get('tag')).toEqual('tr');
			expect(value.tds.length).toEqual(2);
		});

		it('should push a row to the designated location', function(){
			var t = new HtmlTable();
			t.push(['red', 'blue']);
			var rows = t.body.rows;
			var value = t.push(['kiwi', 'green'], {}, rows[0], 'td', 'before');
			expect(value.tr).toEqual(t.body.rows[0]);
		});

	});

	describe('HtmlTable:pushMany', function(){
		it('should push many rows', function(){
			var t = new HtmlTable();
			var rows = t.pushMany([
					[1, 'one'],
					[2, 'two'],
					[3, 'three']
				], {
				'class': 'tableRowClass'
			});
			expect(rows.length).toEqual(3);
			expect(t.body.rows.length).toEqual(3);
			expect(rows[0].tr.hasClass).toBeTruthy();
			tds = t.body.rows[0].getElements('td');
			expect(tds.length).toEqual(2);
			expect(tds[0].get('text')).toEqual('1');
			expect(tds[1].get('text')).toEqual('one');
		});

	});

	describe('HtmlTable:update', function(){

		it('should update a table row', function(){
			var table = new HtmlTable();
			var row = table.push(['hello','world']);
			var newrow = table.update(row.tr, ['I','work']);
			expect(newrow.tds.get('text')).toEqual(['I', 'work']);
		});

	});

	describe('HtmlTable:empty', function(){

		it('should empty a table', function(){
			var table = new HtmlTable();
			table.push(['hello','world']);
			table.push(['hello','world again']);
			expect(table.body.rows.length).toEqual(2);
			table.empty();
			expect(table.body.rows.length).toEqual(0);
			table.empty();
			expect(table.body.rows.length).toEqual(0);
		});

	});


	describe('HtmlTable cloned Element methods', function(){

		var t = new HtmlTable({
			rows: [
				['lemon', 'yellow'],
				['apple', 'red']
			]
		});

		it('should inject the table in another element', function(){
			var wrapper = new Element('div');
			t.inject(wrapper);
			expect(wrapper.contains($(t))).toBeTruthy();
		});

		it('should adopt another element into the table', function(){
			var tr = new Element('tr').adopt(
				new Element('td'),
				new Element('td')
			);
			var ret = t.adopt(tr);

			expect($(t).contains(tr)).toBeTruthy();
			expect(ret).toEqual(t);
		});

	});

});

/*
---
name: Keyboard Tests
requires: [More/Keyboard]
provides: [Keyboard.Tests]
...
*/
// Only run this spec in browsers other than IE6-8 because they can't properly simulate key events
if (window.addEventListener) describe('Keyboard', function(){

	it('should deactivate and reactivate', function(){

		var onActivate = jasmine.createSpy(),
		onDeactivate = jasmine.createSpy(),

		kb = new Keyboard({
			onActivate: onActivate,
			onDeactivate: onDeactivate,
			active: true
		});

		// events

		kb.deactivate();
		expect(onDeactivate).toHaveBeenCalled();

		kb.activate();
		expect(onActivate).toHaveBeenCalled();

		expect(kb.isActive()).toEqual(true);

		// toggle

		kb.toggleActive();

		expect(kb.isActive()).toEqual(false);

		// options

		var kb2 = new Keyboard({
			active: true
		});

		expect(kb2.isActive()).toEqual(true);

	});

	it('should fire events for the given key combinations', function(){

		var callback = jasmine.createSpy(), called = false;

		var kb = new Keyboard({
			events: {
				'shift+;': callback
			},
			active: true
		});

		Syn.type('[shift];[shift-up]', document.body, function(){
			called = true;
		});

		waitsFor(2, function(){
			return called;
		});

		runs(function(){
			expect(callback).toHaveBeenCalled();
		});

	});

	it('should fire events for the + key', function(){

		var callback = jasmine.createSpy();

		var kb = new Keyboard({
			events: {
				'+': callback
			},
			active: true
		});

		Syn.type('+', document.body);

		expect(callback).toHaveBeenCalled();

	});

	xit('should bubble up the keyboard instances', function(){

		var callback = jasmine.createSpy(), called = false;

		var kb = new Keyboard({
			events: {']': callback}
		});

		var kb2 = new Keyboard({
			parent: kb
		});

		var kb3 = new Keyboard({
			parent: kb2,
			active: true
		});

		Syn.key(']', document.body, function(){
			called = true;
		});

		waitsFor(2, function(){
			return called;
		});

		runs(function(){
			expect(callback).toHaveBeenCalled();
		});

	});

	it('should fire the event on the onkeyup', function(){

		var callback = jasmine.createSpy(), called;

		var kb = new Keyboard({
			events: {
				'keyup:]': callback
			},
			active: true
		});

		Syn.key(']', document.body, function(){
			called = true;
		});

		waitsFor(2, function(){
			return called;
		});

		runs(function(){
			expect(callback).toHaveBeenCalled();
		});

	});


});

/*
---
name: Locale Tests
requires: [More/Locale, More/Locale.en-US.Form.Validator, More/Locale.en-US.Date, More/Locale.fr-FR.Date, More/Locale.en-US.Number]
provides: [Locale.Tests]
...
*/
describe('Locale', function(){

	// In the specs there is only english available
	Locale.define('fr-FR', 'FormValidator', {
		required: 'Ce champ est obligatoire.'
	});

	it('should return english form validator message', function(){
		Locale.use('en-US');
		if (MooTools.lang) expect(MooTools.lang.get('FormValidator', 'required')).toEqual('This field is required.');

		expect(Locale.get('FormValidator.required')).toEqual('This field is required.');
	});

	it('should cascade through to english', function(){
		Locale.use('en-US');
		expect(Locale.get('FormValidator.required')).toEqual('This field is required.');
	});

	it('should return french form validator message', function(){
		Locale.use('fr-FR');

		expect(Locale.get('FormValidator.required')).toEqual('Ce champ est obligatoire.');
	});

	it('should return the correct locale name', function(){
		Locale.use('fr-FR');
		expect(Locale.getCurrent().name).toEqual('fr-FR');
		Locale.use('non-existsing');
		expect(Locale.getCurrent().name).toEqual('fr-FR');
	});

	it('should inherit from other locales', function(){

		Locale.define('nl-NL').inherit('en-US');

		Locale.use('nl-NL');

		Locale.define('nl-NL', 'Number', {
			'foo': 'bar'
		});

		Locale.define('EU').inherit('World');
		Locale.define('World', 'Number', {
			'bar': 'foo'
		}).inherit('EU'); // test for recursion

		Locale.inherit('nl-NL', 'EU', 'Number');

		expect(Locale.get('Number.foo')).toEqual('bar');
		expect(Locale.get('Number.bar')).toEqual('foo');

	});

	it('should return a object when no key is specified', function(){
		var obj = {
			'guten': 'tag'
		};

		Locale.define('de-fo', 'Date', obj);
		Locale.use('de-fo');

		expect(Locale.get('Date')).toEqual(obj);
	});

	it('should return a cloned object without reference to the Locale.Set.data', function(){
		Locale.define('de-DE', 'Ping', {
			ping: 'w00fz, Stop mit Pingen'
		});
		Locale.use('de-DE');
		expect(Locale.get('Ping') === Locale.get('Ping')).toBeFalsy();
		Locale.use('en-US'); // to not export this to other Specs
	});
});

//<1.2compat>
describe('MooTools.lang 1.2 specs', function(){

    it('should return english form validator message', function(){
        MooTools.lang.setLanguage('en-US');
        expect(MooTools.lang.get('FormValidator', 'required')).toEqual('This field is required.');
    });

    it('should cascade through to english', function(){
        MooTools.lang.set('en-GB', 'cascade', ['IT', 'ESP', 'gbENG']);
        MooTools.lang.setLanguage('en-GB');
        expect(MooTools.lang.get('FormValidator', 'required')).toEqual('This field is required.');
    });

    it('should return french form validator message', function(){
        MooTools.lang.setLanguage('fr-FR');
        expect(MooTools.lang.get('FormValidator', 'required')).toEqual('Ce champ est obligatoire.');
        MooTools.lang.setLanguage('en-US'); // to not export this to other Specs
    });

});
//</1.2compat>


/*
---
name: Request.JSONP Tests
requires: [More/Request.JSONP]
provides: [Request.JSONP.Tests]
...
*/
describe('Request.JSONP', function(){

	it('should grab some json from from assets/jsonp.js', function(){

		var onComplete = jasmine.createSpy(),
			complete = false,
			timeout = false,
			onRequest = jasmine.createSpy();

		var request = new Request.JSONP({
			log: true,
			callbackKey: 'jsoncallback',
			url: 'base/Tests/Specs/assets/jsonp.js',
			timeout: 20000,
			onComplete: function(){
				onComplete.apply(this, arguments);
				complete = true;
			},
			onRequest: function(src, script){
				onRequest.call(this, src);
				expect(script.get('tag')).toEqual('script');
			},
			onTimeout: function(){
				timeout = true;
			}
		});

		runs(function(){
			request.send();
		});

		runs(function(){
			expect(onRequest).toHaveBeenCalledWith('base/Tests/Specs/assets/jsonp.js?jsoncallback=Request.JSONP.request_map.request_0');
		});

		waitsFor(1600, function(){
			return complete || timeout;
		});

		runs(function(){
			expect(onComplete).toHaveBeenCalled();
			// See json.js file
			expect(onComplete.mostRecentCall.args[0].test).toEqual(true);
		});

	});

});

/*
---
name: Array.Extras Tests
requires: [More/Array.Extras]
provides: [Array.Extras.Tests]
...
*/
describe('Array.min', function(){

	it('should return the lowest number in the array', function(){
		expect([1, 2, 3, 4, 5, 6].min()).toEqual(1);
	});

});

describe('Array.max', function(){

	it('should return the highest number in the array', function(){
		expect([1, 2, 3, 4, 5, 6].max()).toEqual(6);
	});

});

describe('Array.average', function(){

	it('should return the average number of the values in the array', function(){
		expect([1, 2, 3, 4, 5].average()).toEqual(3);
	});

});

describe('Array.shuffle', function(){

	it('should shuffle an array', function(){
		var toShuffle = [],
			toShuffle2 = [];
		(100).times(function(i){
			toShuffle.push(i);
			toShuffle2.push(i);
		});
		expect(toShuffle.shuffle()).toNotEqual(toShuffle2.shuffle());
		expect(toShuffle.shuffle().length).toEqual(100);
		toShuffle.sort();
		toShuffle2.sort();
		expect(toShuffle).toEqual(toShuffle2);
	});

});

describe('Array.sum', function(){

	it("should return 0 for an empty array", function(){
		expect([].sum()).toEqual(0);
	});

	it("should sum an array with one item", function(){
		expect([3].sum()).toEqual(3);
	});

	it("should sum an array of integers", function(){
		expect([1, 2, 3].sum()).toEqual(6);
	});

	it("should sum an array of floats", function(){
		expect([1.5, 2.5, 3.5].sum()).toEqual(7.5);
	});

	it("should handle numeric strings in arrays correctly", function(){
		expect([1, "2.5", 3].sum()).toEqual(6.5);
		expect([1, "2", 3].sum()).toEqual(6);
	});

	it("should skip null and undefined items", function(){
		expect([1, 2, null, 4].sum()).toEqual(7);
		expect([1, 2, undefined, 4].sum()).toEqual(7);
	});

	it("should work with a sparse array", function(){
		var array = [1, 2];
		array[5] = 6;
		expect(array.sum()).toEqual(9);
	});

	it("should handle Infinity correctly", function(){
		expect([1, 2, Infinity, 5].sum()).toEqual(Infinity);
		expect([1, 2, -Infinity, 5].sum()).toEqual(-Infinity);
		expect([1, 2, Infinity, 5, -Infinity].sum()).toBeNaN();
	});

	it("should return NaN when not all items are numeric", function(){
		expect([1, 2, "", 5].sum()).toBeNaN();
		expect([1, 2, "foo", 5].sum()).toBeNaN();
	});

});


describe('Array.unique', function(){

	it('should remove duplicates from an array', function(){
		expect(['apple', 'lemon', 'pear', 'lemon', 'apple'].unique()).toEqual(["apple", "lemon", "pear"]);
	});

	it('should not remove items that are dedupe', function(){
		expect([0, '0', false, null, true].unique()).toEqual([0, '0', false, null, true]);
	});

});

describe('Array.reduce', function(){

	it('should have been implemented according ES5', function(){

		// Examples from https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduce

		expect([0,1,2,3,4].reduce(function(previousValue, currentValue, index, array){
			return previousValue + currentValue;
		})).toEqual(10);

		expect([0,1,2,3,4].reduce(function(previousValue, currentValue, index, array){
			return previousValue + currentValue;
		}, 10)).toEqual(20);

		expect([[0,1], [2,3], [4,5]].reduce(function(a,b){
			return a.concat(b);
		}, [])).toEqual([0, 1, 2, 3, 4, 5]);

	});

});

describe('Array.reduceRight', function(){

	it('should have been implemented according ES5', function(){

		// Examples from https://developer.mozilla.org/En/Core_JavaScript_1.5_Reference/Global_Objects/Array/ReduceRight

		expect([0,1,2,3,4].reduceRight(function(previousValue, currentValue, index, array){
			return previousValue + currentValue;
		})).toEqual(10);

		expect([0,1,2,3,4].reduceRight(function(previousValue, currentValue, index, array){
			return previousValue + currentValue;
		}, 10)).toEqual(20);

		expect([[0, 1], [2, 3], [4, 5]].reduceRight(function(a, b){
			return a.concat(b);
		}, [])).toEqual([4, 5, 2, 3, 0, 1]);

	});

});

describe('Array.pluck', function(){

	it('should return the specified property from each element', function(){
		expect([{ a: 1 }, { a: 2 }].pluck('a')).toEqual([1, 2]);
	});

	it('should return undefined properties', function(){
		expect([{ a: 1 }, { b: 2 }].pluck('a')).toEqual([1, undefined]);
	});

});


/*
---
name: Date.Extras Tests
requires: [More/Date.Extras]
provides: [Date.Extras.Tests]
...
*/
describe('Date.getTimePhrase', function(){

	it('should describe a number of seconds in simple terms', function(){
		var phrases = {
			'less than a minute ago': 30,
			'about a minute ago': 65,
			'2 minutes ago': 120,
			'about 3 hours ago': 60 * 60 * 3,
			'1 day ago': 60 * 60 * 25,
			'2 days ago': 60 * 60 * 48,
			'1 week ago': 60 * 60 * 24 * 7,
			'3 weeks ago': 60 * 60 * 24 * 20,
			'1 month ago': 60 * 60 * 24 * 30,
			'2 months ago': 60 * 60 * 24 * 55,
			'10 years ago': 60 * 60 * 24 * 3650,
			'about a minute from now': -65,
			'2 minutes from now': -120,
			'about 3 hours from now': -60 * 60 * 3,
			'1 day from now': -60 * 60 * 25,
			'2 days from now': -60 * 60 * 48,
			'2 weeks from now': -60 * 60 * 24 * 16,
			'1 month from now': -60 * 60 * 24 * 28,
			'2 months from now': -60 * 60 * 24 * 55
		};

		for (var phrase in phrases)
			expect(Date.getTimePhrase(phrases[phrase])).toEqual(phrase);
	});

});

describe('Date.timeDiff', function(){

	it('should return a readable time difference format', function(){
		var date = new Date('06/20/2011'),
			orig = date.clone();

		expect(date.timeDiff(orig)).toEqual('0s');
		expect(date.decrement('second', 10).timeDiff(orig)).toEqual('10s');
		expect(date.decrement('month', 1).timeDiff(orig)).toEqual('31d:0h:0m:10s');
		expect(date.decrement('year', 2).timeDiff(orig)).toEqual('2y:31d:0h:0m:10s');
		expect(date.timeDiff()).not.toBeNull();
	});

	it('should return a positive difference', function(){
		var date = new Date('06/20/2011'),
			orig = date.clone();

		expect(date.increment('month', 1).timeDiff(orig)).toEqual('30d:0h:0m:0s');
	});

});

describe('Date.timeAgoInWords', function(){

	it('should return a readable description of the age of a date', function(){
		var d = new Date();
		expect(d.decrement('day', 2).timeAgoInWords()).toEqual('2 days ago');
	});

});

describe('Date.Extras.parse', function(){

	it('should parse a string value into a date', function(){

		expect(Date.parse('today').get('date')).toEqual(new Date().get('date'));
		expect(Date.parse('yesterday').get('date')).toEqual(new Date().decrement().get('date'));
		expect(Date.parse('tomorrow').get('date')).toEqual(new Date().increment().get('date'));
	});

});

/*
---
name: Date Tests
requires: [More/Date]
provides: [Date.Tests]
...
*/
(function(global){

describe('Date', function(){

	describe('Date.set', function(){

		it('should set the hour', function(){
			var d = new Date().set('hr', 20);
			expect(d.getHours()).toEqual(20);
		});

		it('should set multiple values with an object', function(){
			var d = new Date().set({
				hr: 20,
				min: 30,
				month: 2
			});
			expect(d.getHours()).toEqual(20);
			expect(d.getMinutes()).toEqual(30);
			expect(d.getMonth()).toEqual(2);
		});

		it('should take care of UperCaSed method names', function(){
			var d = new Date().set('MilliSecoNds', 400);
			expect(d.getMilliseconds()).toEqual(400);
		});

		it('should do nothing (so not throwing errors) when a setter method does not exist', function(){
			Date.Methods.quatsch = 'Quatsch';
			var d = new Date().set('quatsch', 40);
		});

	});

	describe('Date.get', function(){

		it('should get the hour', function(){
			var d = new Date();
			d.setHours(20);
			expect(d.get('hr')).toEqual(20);
		});

		it('should set multiple values with an object', function(){
			var d = new Date().set({
				hr: 20,
				min: 30,
				month: 2
			});
			expect(d.get('hr', 'min', 'month')).toEqual({hr: 20, min: 30, month: 2});
		});

		it('should take care of UperCaSed method names', function(){
			var d = new Date();
			d.setMilliseconds(400);
			expect(d.get('MilliSeconDs')).toEqual(400);
		});

		it('should return null when a getter method does not exist', function(){
			Date.Methods.quatsch = 'Quatsch';
			expect(new Date().get('quatsch')).toEqual(null);
		});

	});

	describe('Date.clone', function(){

		it('should clone a Date instance', function(){
			var d = new Date(Date.UTC(1999, 11, 31));
			var dc = d.clone();
			expect(d.get('time')).toEqual(dc.get('time'));
		});

		it('the cloned Date should be a new instance of Date', function(){
			var d = new Date(Date.UTC(1999, 11, 31));
			var dc = d.clone();
			dc.set('date', 1);
			expect(d.get('time')).toNotEqual(dc.get('time'));
		});

	});

	describe('Date.increment', function(){

		// All these tests avoid leap years and daylight savings dates.
		// Other tests may be needed.
		it('should increment a Date instance using milliseconds', function(){
			var d =  new Date(Date.UTC(1998, 10, 20, 1, 1, 1, 1));
			var d2 = new Date(Date.UTC(1998, 10, 20, 1, 1, 1, 2));
			d.increment('ms');
			expect(d).toEqual(d2);
		});
		it('should increment a Date instance using seconds', function(){
			var d =  new Date(Date.UTC(1998, 10, 20, 1, 1, 1));
			var d2 = new Date(Date.UTC(1998, 10, 20, 1, 1, 2));
			d.increment('second');
			expect(d).toEqual(d2);
		});
		it('should increment a Date instance using minutes', function(){
			var d =  new Date(Date.UTC(1998, 10, 20, 1, 1, 1));
			var d2 = new Date(Date.UTC(1998, 10, 20, 1, 2, 1));
			d.increment('minute');
			expect(d).toEqual(d2);
		});
		it('should increment a Date instance using hours', function(){
			var d =  new Date(Date.UTC(1998, 10, 20, 1, 1, 1));
			var d2 = new Date(Date.UTC(1998, 10, 20, 2, 1, 1));
			d.increment('hour');
			expect(d).toEqual(d2);
		});
		it('should increment a Date instance (default)', function(){
			var d =  new Date(Date.UTC(1998, 10, 20, 1, 1, 1));
			var d2 = new Date(Date.UTC(1998, 10, 21, 1, 1, 1));
			d.increment();
			expect(d).toEqual(d2);
		});
		it('should increment a Date instance using days', function(){
			var d =  new Date(Date.UTC(1998, 10, 20, 1, 1, 1));
			var d2 = new Date(Date.UTC(1998, 10, 21, 1, 1, 1));
			d.increment('day');
			expect(d).toEqual(d2);
		});
		it('should increment a Date instance using months', function(){
			var d =  new Date(Date.UTC(1998, 10, 20, 1, 1, 1));
			var d2 = new Date(Date.UTC(1998, 11, 20, 1, 1, 1));
			d.increment('month');
			expect(d).toEqual(d2);
		});
		it('should increment a Date instance using years', function(){
			var d =  new Date(Date.UTC(1998, 10, 20, 1, 1, 1));
			var d2 = new Date(Date.UTC(1999, 10, 20, 1, 1, 1));
			d.increment('year');
			expect(d).toEqual(d2);
		});

	});

	describe('Date.decrement', function(){

		// All these tests avoid leap years and daylight savings dates.
		// Other tests may be needed.
		it('should decrement a Date instance using milliseconds', function(){
			var d =  new Date(Date.UTC(1997, 10, 20, 1, 1, 1, 2));
			var d2 = new Date(Date.UTC(1997, 10, 20, 1, 1, 1, 1));
			d.decrement('ms');
			expect(d).toEqual(d2);
		});
		it('should decrement a Date instance using seconds', function(){
			var d =  new Date(Date.UTC(1997, 10, 20, 1, 1, 2));
			var d2 = new Date(Date.UTC(1997, 10, 20, 1, 1, 1));
			d.decrement('second');
			expect(d).toEqual(d2);
		});
		it('should decrement a Date instance using minutes', function(){
			var d =  new Date(Date.UTC(1997, 10, 20, 1, 2, 1));
			var d2 = new Date(Date.UTC(1997, 10, 20, 1, 1, 1));
			d.decrement('minute');
			expect(d).toEqual(d2);
		});
		it('should decrement a Date instance using hours', function(){
			var d =  new Date(Date.UTC(1997, 10, 20, 2, 1, 1));
			var d2 = new Date(Date.UTC(1997, 10, 20, 1, 1, 1));
			d.decrement('hour');
			expect(d).toEqual(d2);
		});
		it('should decrement a Date instance (default)', function(){
			var d =  new Date(Date.UTC(1997, 10, 21, 1, 1, 1));
			var d2 = new Date(Date.UTC(1997, 10, 20, 1, 1, 1));
			d.decrement();
			expect(d).toEqual(d2);
		});
		it('should decrement a Date instance using days', function(){
			var d =  new Date(Date.UTC(1997, 10, 21, 1, 1, 1));
			var d2 = new Date(Date.UTC(1997, 10, 20, 1, 1, 1));
			d.decrement('day');
			expect(d).toEqual(d2);
		});
		it('should decrement a Date instance using months', function(){
			var d =  new Date(Date.UTC(1997, 11, 20, 1, 1, 1));
			var d2 = new Date(Date.UTC(1997, 10, 20, 1, 1, 1));
			d.decrement('month');
			expect(d).toEqual(d2);
		});
		it('should decrement a Date instance using years', function(){
			var d =  new Date(Date.UTC(1998, 10, 20, 1, 1, 1));
			var d2 = new Date(Date.UTC(1997, 10, 20, 1, 1, 1));
			d.decrement('year');
			expect(d).toEqual(d2);
		});

	});

	describe('Date.isLeapYear', function(){

		it('should return true when the date instance is a leap year', function(){
			expect(new Date(Date.UTC(2000, 2, 1)).isLeapYear()).toEqual(true);
			expect(new Date(Date.UTC(2004, 2, 1)).isLeapYear()).toEqual(true);
		});

		it('should return false when the date instance is a leap year', function(){
			expect(new Date(Date.UTC(1900, 2, 1)).isLeapYear()).toEqual(false);
			expect(new Date(Date.UTC(2002, 2, 1)).isLeapYear()).toEqual(false);
		});

	});

	describe('Date.clearTime', function(){

		it('should clear the time portion of a Date instance', function(){
			var d =  new Date('Oct 01 1997 10:45:25');
			var d2 = new Date('Oct 01 1997 00:00:00');
			d.clearTime();
			expect(d).toEqual(d2);
		});

	});

	describe('Date.diff', function(){

		// All these tests avoid leap years and daylight savings dates.
		// Other tests may be needed.
		it('should compare two Date instances (milliseconds)', function(){
			var d  = new Date(Date.UTC(1997, 10, 20, 1, 1, 1, 0));
			var d2 = new Date(Date.UTC(1997, 10, 20, 1, 1, 1, 999));
			expect(d.diff(d2, 'ms')).toEqual(999);
		});
		it('should compare two Date instances (seconds)', function(){
			var d  = new Date(Date.UTC(1997, 10, 20, 1, 1,  0));
			var d2 = new Date(Date.UTC(1997, 10, 20, 1, 1, 10));
			expect(d.diff(d2, 'second')).toEqual(10);
		});
		it('should compare two Date instances (minutes)', function(){
			var d  = new Date(Date.UTC(1997, 10, 20, 1,  0, 1));
			var d2 = new Date(Date.UTC(1997, 10, 20, 1, 10, 1));
			expect(d.diff(d2, 'minute')).toEqual(10);
		});
		it('should compare two Date instances (hours)', function(){
			var d  = new Date(Date.UTC(1997, 10, 20,  0, 1, 1));
			var d2 = new Date(Date.UTC(1997, 10, 20, 10, 1, 1));
			expect(d.diff(d2, 'hour')).toEqual(10);
		});
		it('should compare two Date instances (default)', function(){
			var d  = new Date(Date.UTC(1997, 10, 20, 1, 1, 1));
			var d2 = new Date(Date.UTC(1997, 10, 30, 1, 1, 1));
			expect(d.diff(d2)).toEqual(10);
		});
		it('should compare two Date instances (days)', function(){
			var d  = new Date(Date.UTC(1997, 10, 20, 1, 1, 1));
			var d2 = new Date(Date.UTC(1997, 10, 30, 1, 1, 1));
			expect(d.diff(d2, 'day')).toEqual(10);
		});
		it('should compare two Date instances (months)', function(){
			var d  = new Date(Date.UTC(1997,  9, 20, 1, 1, 1));
			var d2 = new Date(Date.UTC(1997, 11, 20, 1, 1, 1));
			expect(d.diff(d2, 'month')).toEqual(2);

			// February bug
			d  = new Date(Date.UTC(1997, 1, 1, 1, 1, 1));
			d2 = new Date(Date.UTC(1997, 2, 1, 1, 1, 1));
			expect(d.diff(d2, 'month')).toEqual(1);
		});
		it('should compare two Date instances (years)', function(){
			var d  = new Date(Date.UTC(1997, 10, 20, 1, 1, 1));
			var d2 = new Date(Date.UTC(1999, 10, 20, 1, 1, 1));
			expect(d.diff(d2, 'year')).toEqual(2);

			// parseInt bug with anything less than 1e-6
			d = new Date(1277244682000);
			d2 = new Date(1277244682237);
			expect(d.diff(d2, 'year')).toEqual(0);
		});

	});

	describe('Date.getTimezone', function(){

		it('should return the time zone of a Date instance', function(){
			var d = new Date(Date.UTC(2000, 0, 1, 1, 1, 1));
			if (Date.UTC()) expect(d.get('timezone')).toEqual(new Date(Date.UTC()).get('timezone'));
			else expect(d.get('timezone')).toEqual('GMT');
		});

	});

	describe('Date.getWeek', function(){

		beforeEach(function(){
			// Make sure we're using monday as first day of week for these specs
			Locale.use(Locale.define('testGetWeek', 'Date', {
				firstDayOfWeek: 1
			}));
		});

		it('should return the week of the year of a Date instance', function(){
			var d = new Date(2007, 0, 1, 1, 1, 1);
			expect(d.get('week')).toEqual(1); // Mon Jan 01 2007
			d.increment('day', 7 * 10 + 2);
			expect(d.get('week')).toEqual(11); // Wed Mar 14 2007
			d.increment('week', 42);
			expect(d.get('week')).toEqual(1); // Wed Jan 02 2008
		});

		it('should return the last week of the previous year if the largest part of the first week is in the previous year', function(){
			var d = new Date(2000, 0, 1, 1, 1, 1);
			expect(d.get('week')).toEqual(52); // Sat Jan 01 2000
			d.increment('year', 21);
			expect(d.get('week')).toEqual(53); // Fri Jan 01 2021
		});

		it('should return the first week of the year if the largest part of the first week is in the current year', function(){
			var d = new Date(2002, 0, 1, 1, 1, 1);
			expect(d.get('week')).toEqual(1); // Tue Jan 01 2002
		});

		it('should return the first week of the next year if the largest part of the last week is in the next year', function(){
			var d = new Date(2012, 11, 31, 1, 1, 1);
			expect(d.get('week')).toEqual(1); // Mon Dec 31 2012
		});

		it('should return the last week of the year if the largest part of the last week is in the current year', function(){
			var d = new Date(2010, 11, 31, 1, 1, 1);
			expect(d.get('week')).toEqual(52); // Fri Dec 31 2010
			d.increment('year', 10);
			expect(d.get('week')).toEqual(53); // Thu Dec 31 2020
		});

		it('should return week 2 for Jan 07, when Jan 01 is on a tuesday', function(){
			var d = new Date(2002, 0, 7, 1, 1, 1);
			expect(d.get('week')).toEqual(2); // Mon Jan 07 2002
		});

		it('should return different week numbers depending on the culture', function(){
			var locale = new Locale.Set('custom');
			Locale.use(locale);

			var d = new Date(2000, 11, 31, 1, 1, 1); // Sun Dec 31 2000
			locale.define('Date', 'firstDayOfWeek', 1); // Monday
			expect(d.get('week')).toEqual(52);
			locale.define('Date', 'firstDayOfWeek', 0); // Sunday
			expect(d.get('week')).toEqual(54);
			locale.define('Date', 'firstDayOfWeek', 6); // Saturday
			expect(d.get('week')).toEqual(53);

			d.increment('day', 1827); // Sun Jan 01 2006
			locale.define('Date', 'firstDayOfWeek', 1); // Monday
			expect(d.get('week')).toEqual(52);
			locale.define('Date', 'firstDayOfWeek', 0); // Sunday
			expect(d.get('week')).toEqual(1);
			locale.define('Date', 'firstDayOfWeek', 6); // Saturday
			expect(d.get('week')).toEqual(1);

			Locale.use('en-US');

		});

		afterEach(function(){
			// set back to en-US for further testing
			Locale.use('en-US');
		});

	});

	describe('Date.format', function(){

		Locale.use('en-US');
		var d = new Date('Thu Nov 20 1997 01:02:03');
		var d2 = new Date('Thu Nov 2 1997 20:02:03');

		it('should return a short day', function(){
			expect(d.format('%a')).toEqual('Thu');
		});
		it('should return a full day', function(){
			expect(d.format('%A')).toEqual('Thursday');
		});
		it('should return a short month', function(){
			expect(d.format('%b')).toEqual('Nov');
		});
		it('should return a full month', function(){
			expect(d.format('%B')).toEqual('November');
		});
		it('should return the full dat to string', function(){
			expect(d.format('%c')).toEqual('Thu Nov 20 01:02:03 1997');
		});
		it('it should return the date as two numbers', function(){
			expect(d.format('%d')).toEqual('20');
			expect(d2.format('%d')).toEqual('02');
		});
		it('should return the date as single number', function(){
			expect(d.format('%e')).toEqual('20');
			expect(d2.format('%e')).toEqual(' 2');
		});
		it('should return the hour as two digits, 00-24', function(){
			expect(d.format('%H')).toEqual('01');
			expect(d2.format('%H')).toEqual('20');
		});
		it('should return the hour as two digits, 00-12', function(){
			expect(d.format('%I')).toEqual('01');
			expect(d2.format('%I')).toEqual('08');
		});
		it('should return the day of year as three digits', function(){
			expect(d.format('%j')).toEqual('324');
		});
		it('should return the hour (0-24) padded with a space', function(){
			expect(d.format('%k')).toEqual(' 1');
			expect(d2.format('%k')).toEqual('20');
		});
		it('should return the hour (0-12) padded with a space', function(){
			expect(d.format('%l')).toEqual(' 1');
			expect(d2.format('%l')).toEqual(' 8');
		});
		it('should return the ms as three digits', function(){
			var d = new Date(2000, 11, 31, 1, 1, 1, 259);
			expect(d.format('%L')).toEqual('259');
		});
		it('should return the month number as two digits', function(){
			expect(d.format('%m')).toEqual('11');
		});
		it('should return the minutes as two digits', function(){
			expect(d.format('%M')).toEqual('02');
		});
		it('should return the ordinal, and should be the same as .getOridnal', function(){
			expect(d.format('%o')).toEqual(d.get('ordinal'));
		});
		it('should return AM or PM', function(){
			expect(d.format('%p')).toEqual('AM');
		});
		it('should return the Unix Timestamp', function(){
			var d = new Date(Date.UTC(2002, 0, 7, 1, 1, 1));
			expect(d.format('%s')).toEqual('1010365261');
		});
		it('should return the seconds as two digits', function(){
			expect(d.format('%S')).toEqual('03');
		});
		it('should format the time as %H:%M:S', function(){
			expect(d.format('%T')).toEqual('01:02:03');
		});
		it('should return the week number as two digits', function(){
			expect(d.format('%U')).toEqual('47');
		});
		it('should return the day of the week', function(){
			expect(d.format('%w')).toEqual('4');
		});
		it('should format the date as %d-%m-%Y or something, according to the localization', function(){
			expect(d.format('%x')).toEqual('11/20/1997');
		});
		it('should format the time as %H:%M%p, accordiong to localization', function(){
			expect(d.format('%X')).toEqual('01:02AM');
		});
		it('should format the year as two digits', function(){
			expect(d.format('%y')).toEqual('97');
		});
		it('should format the year as four digits', function(){
			expect(d.format('%Y')).toEqual('1997');
		});
		it('should format the timezone', function(){
			if (Date.UTC()) expect(d.format('%Z')).toEqual(new Date(Date.UTC()).get('timezone'));
			else expect(d.format('%Z')).toEqual('GMT');
		});
		it('should only replace the % when it is followd by a single a-z', function(){
			expect(d.format('%y%')).toEqual('97%');
		});

		describe('shortcuts', function(){

			it('should support the db shortcut', function(){
				expect(d.format('db')).toEqual(d.format('%Y') + '-' + d.format('%m') + '-' + d.format('%d') + ' ' + d.format('%H') + ':' + d.format('%M') + ':' + d.format('%S'));
				expect(d.format('db')).toEqual('1997-11-20 01:02:03');
			});

			it('should support the compact shortcut', function(){
				expect(d.format('compact')).toEqual(d.format('%Y') + d.format('%m') + d.format('%d') + 'T' + d.format('%H') + d.format('%M') + d.format('%S')); // missing!
				expect(d.format('compact')).toEqual('19971120T010203'); // missing!
			});

			it('should support the iso8601 shortcut', function(){
				expect(new Date(Date.UTC(1997, 10, 20, 0, 2 , 3)).format('iso8601')).toEqual('1997-11-20T00:02:03.000Z');
			});

			it('should support the rfc822 shortcut', function(){
				expect(d.format('rfc822')).toEqual(d.format('%a') + ', ' + d.format('%d') + ' ' + d.format('%b') + ' ' + d.format('%Y') + ' ' + d.format('%H') + ':' + d.format('%M') + ':' + d.format('%S') + ' ' + d.format('%Z'));
				if (Date.UTC()) expect(d.format('rfc822')).toEqual('Thu, 20 Nov 1997 01:02:03 ' + new Date(Date.UTC()).get('timezone'));
				else expect(d.format('rfc822')).toEqual('Thu, 20 Nov 1997 01:02:03 GMT');
			});

			it('should support the rfc2822 shortcut', function(){
				expect(d.format('rfc2822')).toEqual(d.format('%a') + ', ' + d.format('%d') + ' ' + d.format('%b') + ' ' + d.format('%Y') + ' ' + d.format('%H') + ':' + d.format('%M') + ':' + d.format('%S') + ' ' + d.format('%z'));
			});

			it('should support the short shortcut', function(){
				expect(d.format('short')).toEqual(d.format('%d') + ' ' + d.format('%b') + ' ' + d.format('%H') + ':' + d.format('%M'));
				expect(d.format('short')).toEqual('20 Nov 01:02');
			});

			it('should support the long shortcut', function(){
				expect(d.format('long')).toEqual(d.format('%B') + ' ' + d.format('%d') + ', ' + d.format('%Y') + ' ' + d.format('%H') + ':' + d.format('%M'));
				expect(d.format('long')).toEqual('November 20, 1997 01:02');
			});

		});

		it('should return accented dates in correct abbreviated form', function(){
			Locale.use('fr-FR');
			d = new Date('Thu Feb 20 1997 01:02:03');
			expect(d.format('%b')).toEqual('févr.');
			Locale.use('en-US');
		});

	});

	describe('Date.getOrdinal', function(){

		it('should get the ordinal for a Date instance', function(){
			var d = new Date(1999, 11, 1);
			expect(d.get('ordinal')).toEqual('st');
			d.increment();
			expect(d.get('ordinal')).toEqual('nd');
			d.increment();
			expect(d.get('ordinal')).toEqual('rd');
			d.increment();
			expect(d.get('ordinal')).toEqual('th');
			d.increment('day', 17);
			expect(d.get('ordinal')).toEqual('st');
			d.increment();
			expect(d.get('ordinal')).toEqual('nd');
			d.increment();
			expect(d.get('ordinal')).toEqual('rd');
			d.increment();
			expect(d.get('ordinal')).toEqual('th');
			d.increment('day', 7);
			expect(d.get('ordinal')).toEqual('st');
		});

	});

	describe('Date.getDayOfYear', function(){

		it('should get the day of the year for a Date instance', function(){
			var d = new Date(1999, 0, 1, 1, 1, 1, 1);
			expect(d.get('dayofyear')).toEqual(1); // 1st jan 1999
			d.increment();
			expect(d.get('dayofyear')).toEqual(2); //2nd jan 1999
			d.increment('day', 364);
			expect(d.get('dayofyear')).toEqual(1); // 1st jan 2000 - a leap year
			d.increment('day', 365); // should stay in the same year!
			expect(d.get('dayofyear')).toEqual(366);
		});

	});

	describe('Date.getLastDayOfMonth', function(){

		it('should get the last day of the month for a Date instance', function(){
			var d = new Date(1999, 0, 1, 1, 1, 1, 1);
			expect(d.get('lastdayofmonth')).toEqual(31); // 1st jan 1999
			d.increment('day', 31);
			expect(d.get('lastdayofmonth')).toEqual(28); // 1st Feb 1999
			d.increment('day', 365); // 29th feb 2000 - a leap year!
			expect(d.get('lastdayofmonth')).toEqual(29);
		});

	});

	describe('Date.isValid', function(){

		it('should return a proper response for isValid', function(){
			expect(new Date().isValid()).toEqual(true);
			expect(Date.isValid(new Date())).toEqual(true);
			expect(new Date('foo').isValid()).toEqual(false);
			expect(Date.isValid(new Date('foo'))).toEqual(false);
			expect(Date.isValid(null)).toEqual(false);
		});

	});

	describe('Date.parse', function(){

		Locale.use('en-US');

		it('should parse a string datestamp', function(){
			expect(Date.parse('1277244682000')).toEqual(new Date(1277244682000));
		});

		it('should parse zero into a date', function(){
			expect(Date.parse(0)).toEqual(new Date(0));
		});

		it('should parse a millisecond value into a date', function(){
			var d = new Date(Date.UTC(2000, 0, 1, 1, 1, 1));
			expect(Date.parse(d.getTime())).toEqual(d);
		});

		it('should parse several date formats into a date instance', function(){
			var d = new Date(2000, 11, 2, 0, 0, 0, 0);
			expect(Date.parse(d.format('%x'))).toEqual(d);
			expect(Date.parse(d.format('%b %d %Y'))).toEqual(d);
			expect(Date.parse(d.format('%d %B %Y'))).toEqual(d);
			expect(Date.parse(d.format('%Y %b %d'))).toEqual(d);
			expect(Date.parse(d.format('%o %b %d %X %z %Y'))).toEqual(d);

			['-', '.', '/'].each(function(punc){
				expect(Date.parse(d.format('%x').replace(/[-.\/]/g, punc))).toEqual(d);
				expect(Date.parse(d.format('%Y' + punc + '%m' + punc + '%d'))).toEqual(d);
			});
		});

		it('should parse serveral formats including time', function(){
			var d = new Date(2000, 11, 2, 22, 45, 0, 0);
			expect(Date.parse(d.format('%x %X'))).toEqual(d);
			expect(Date.parse(d.format('%B %d %Y %X'))).toEqual(d);
			expect(Date.parse(d.format('%d %b %Y %H:%M'))).toEqual(d);
		});

		it('should parse the strings which are formatted by the shortcuts', function(){
			var d = new Date(2000, 11, 2, 22, 45, 0, 0);
			expect(Date.parse(d.format('iso8601'))).toEqual(d);
			expect(Date.parse(d.format('compact'))).toEqual(d);
			expect(Date.parse(d.format('db'))).toEqual(d);
			expect(Date.parse(d.format('long'))).toEqual(d);
			// expect(Date.parse(d.format('rfc822'))).toEqual(d);
			expect(Date.parse(d.format('rfc2822'))).toEqual(d);
		});

		it('should parse a thousand into years', function(){
			var d = new Date(2000, 0, 1, 0, 0, 0, 0);
			expect(Date.parse('2000')).toEqual(d);
		});

		it('should parse a month name', function(){
			var d = new Date().clearTime();
			expect(Date.parse(d.set({date: 1, mo: d.getMonth()}).format('%B'))).toEqual(d);
		});

		it('should parse times', function(){
			var d = new Date().set({hours: 22, minutes: 45, seconds: 15});
			expect(Date.parse('22:45:15').format('compact')).toEqual(d.format('compact'));

			expect(Date.parse('22:45').format('%H:%M')).toEqual('22:45');
			expect(Date.parse('10:45pm').format('%H:%M')).toEqual('22:45');
			expect(Date.parse('11:45 AM').format('%H:%M')).toEqual('11:45');
		});

		it('should parse 1st, Oct 31 and 31 Oct correctly', function(){

			var now = new Date();
			expect(Date.parse('1st').format('%m/%d')).toEqual(now.format('%m/01'));

			expect(Date.parse('1st Oct').format('%m/%d')).toEqual('10/01');
			expect(Date.parse('Oct 1st').format('%m/%d')).toEqual('10/01');

			expect(Date.parse('31 Oct').format('%m/%d')).toEqual('10/31');
			expect(Date.parse('Oct 31').format('%m/%d')).toEqual('10/31');

		});

		it('should consistently parse dates on any day/month/year', function(){
			// Monkey patch clearTime so parsing starts on Jan 1, 2001
			var clearTime = Date.prototype.clearTime;
			Date.prototype.clearTime = function(){
				return clearTime.call(this.set({mo: 0, date: 30, year: 2001}));
			};

			var d = new Date(2000, 1, 29, 0, 0, 0, 0);
			expect(Date.parse(d.format('%B %d %Y'))).toEqual(d);

			Date.prototype.clearTime = clearTime;
		});

	});

	describe('Date.defineFormat', function(){

		it('should define a new formatter as a string', function(){
			var format = '__' + String.uniqueID();
			var _Date = Date.defineFormat(format, format);
			var d = new Date();
			expect(_Date).toEqual(Date);
			expect(d.format(format)).toEqual(format);
		});

		it('should define a new formatter as a function', function(){
			var format = '__' + String.uniqueID();
			var d = new Date();
			Date.defineFormat(format, function(date){
				expect(date).toEqual(d);
				return format + '__';
			});
			expect(d.format(format)).toEqual(format + '__');
		});

		it('should define mulitple formats', function(){
			var formats = {},
				format1 = '__' + String.uniqueID(),
				format2 = '__' + String.uniqueID();
			formats[format1] = format1;
			formats[format2] = format2;
			Date.defineFormats(formats);
			expect(new Date().format(format1)).toEqual(format1);
		});

	});

});

})(this);

/*
---
name: Hash.Extras Tests
requires: [More/Hash.Extras]
provides: [Hash.Extras.Tests]
...
*/
describe('Hash.getFromPath', function(){

	it('should retrieve a hash value from a path', function(){
		var h = $H({
			animal: {
				human: {
					most_deadly: 'ninja'
				}
			}
		});
		expect(h.getFromPath('animal.human.most_deadly')).toEqual('ninja');
	});
});

/*
---
name: Hash Tests
requires: [More/Hash]
provides: [Hash.Tests]
...
*/

(function(){

function isNumber(num){ return typeof num == 'number'; }
function isArray(arr){ return typeOf(arr) == 'array'; }
function $defined(obj){ return obj != null; }

var hash2 = new Hash({ a: 'string', b: 233, c: {} });


describe("Hash Methods", function(){

	// Hash.constructor

	it('should return a new hash', function(){
		expect(typeOf(new Hash()) == 'hash').toBeTruthy();
	});

	it('should return a copy of a hash', function(){
		var hash = new Hash({a: 1, b: 2, c: 3});
		var copy = new Hash(hash);
		expect(copy !== hash).toBeTruthy();
		expect(copy).toEqual(hash);
	});

	// Hash.erase

	it('should remove a key and its value from the hash', function(){
		var hash = new Hash({a: 1, b: 2, c: 3});
		expect(hash.erase('a')).toEqual(new Hash({b:2,c:3}));
		expect(hash.erase('d')).toEqual(new Hash({b:2,c:3}));

		hash = new Hash({a: 1, b: 2, c: 3});
		expect(hash.erase('a')).toEqual(new Hash({b:2,c:3}));
		expect(hash.erase('d')).toEqual(new Hash({b:2,c:3}));
	});

	// Hash.get

	it('should return the value corresponding to the specified key otherwise null', function(){
		var hash = new Hash({a: 1, b: 2, c: 3});
		expect(hash.get('c')).toEqual(3);
		expect(hash.get('d')).toBeNull();
	});

	// Hash.set

	it('should set the key with the corresponding value', function(){
		var myHash = new Hash({a: 1, b: 2, c: 3}).set('c', 7).set('d', 8);
		expect(myHash).toEqual(new Hash({a:1,b:2,c:7,d:8}));
	});

	// Hash.empty

	it('should empty the hash', function(){
		var hash = new Hash({a: 1, b: 2, c: 3});
		expect(hash.empty()).toEqual(new Hash());
	});

	// Hash.include

	it('should include a key value if the hash does not have the key otherwise ignore', function(){
		var hash = new Hash({a: 1, b: 2, c: 3});
		expect(hash.include('e', 7)).toEqual(new Hash({a:1,b:2,c:3,e:7}));
		expect(hash.include('a', 7)).toEqual(new Hash({a:1,b:2,c:3,e:7}));
	});

	// Hash.keyOf | Hash.indexOf

	it('should return the key of the value or null if not found', function(){
		var hash = new Hash({a: 1, b: 2, c: 3, d: 1});
		expect(hash.keyOf(1)).toEqual('a');
		expect(hash.keyOf('not found')).toBeNull();

		expect(hash.indexOf(1)).toEqual('a');
		expect(hash.indexOf('not found')).toBeNull();
	});

	// Hash.has

	it('should return true if the hash has the key otherwise false', function(){
		var hash = new Hash({a: 1, b: 2, c: 3});
		expect(hash.has('a')).toBeTruthy();
		expect(hash.has('d')).toBeFalsy();
	});

	// Hash.hasValue | Hash.contains

	it('should return true if the hash hasValue otherwise false', function(){
		var hash = new Hash({a: 1, b: 2, c: 3});
		expect(hash.hasValue(1)).toBeTruthy();
		expect(hash.hasValue('not found')).toBeFalsy();

		expect(hash.contains(1)).toBeTruthy();
		expect(hash.contains('not found')).toBeFalsy();
	});

	// Hash.getClean

	it('should getClean JavaScript object', function(){
		var hash = new Hash({a: 1, b: 2, c: 3});
		expect(hash.getClean()).toEqual({a:1,b:2,c:3});
	});

	// Hash.extend

	it('should extend a Hash with an object', function(){
		var hash = new Hash({a: 1, b: 2, c: 3});
		expect(hash.extend({a:4,d:7,e:8})).toEqual(new Hash({a:4,b:2,c:3,d:7,e:8}));
	});

	it('should extend a Hash with another Hash', function(){
		var hash = new Hash({a: 1, b: 2, c: 3});
		expect(hash.extend(new Hash({a:4,d:7,e:8}))).toEqual(new Hash({a:4,b:2,c:3,d:7,e:8}));
	});

	// Hash.combine

	it('should merge a Hash with an object', function(){
		var hash = new Hash({a: 1, b: 2, c: 3});
		expect(hash.combine({a:4,d:7,e:8})).toEqual(new Hash({a:1,b:2,c:3,d:7,e:8}));
	});

	it('should merge a Hash with another Hash', function(){
		var hash = new Hash({a: 1, b: 2, c: 3});
		expect(hash.combine(new Hash({a:4,d:7,e:8}))).toEqual(new Hash({a:1,b:2,c:3,d:7,e:8}));
	});

	// Hash.each

	it('should iterate through each property', function(){
		var newHash = new Hash();
		var hash = new Hash({a: 1, b: 2, c: 3});
		hash.each(function(value, key){
			newHash.set(key, value);
		});
		expect(newHash).toEqual(hash);
	});

	// Hash.map

	it('should map a new Hash according to the comparator', function(){
		expect(hash2.map(isNumber)).toEqual(new Hash({a:false,b:true,c:false}));
	});

	// Hash.filter

	it('should filter the Hash according to the comparator', function(){
		expect(hash2.filter(isNumber)).toEqual(new Hash({b:233}));
	});

	// Hash.every

	it('should return true if every value matches the comparator, otherwise false', function(){
		expect(hash2.every($defined)).toBeTruthy();
		expect(hash2.every(isNumber)).toBeFalsy();
	});

	// Hash.some

	it('should return true if some of the values match the comparator, otherwise false', function(){
		expect(hash2.some(isNumber)).toBeTruthy();
		expect(hash2.some(isArray)).toBeFalsy();
	});

	// Hash.getKeys

	it('getKeys should return an empty array', function(){
		expect(new Hash().getKeys()).toEqual([]);
	});

	it('should return an array containing the keys of the hash', function(){
		expect(hash2.getKeys()).toEqual(['a', 'b', 'c']);
	});

	// Hash.getValues

	it('getValues should return an empty array', function(){
		expect(new Hash().getValues()).toEqual([]);
	});

	it('should return an array with the values of the hash', function(){
		expect(hash2.getValues()).toEqual(['string', 233, {}]);
	});

	// Hash.toQueryString

	it('should return a query string', function(){
		var myHash = new Hash({apple: "red", lemon: "yellow"});
		expect(myHash.toQueryString()).toEqual('apple=red&lemon=yellow');

		var myHash2 = new Hash({apple: ['red', 'yellow'], lemon: ['green', 'yellow']});
		expect(myHash2.toQueryString()).toEqual('apple[0]=red&apple[1]=yellow&lemon[0]=green&lemon[1]=yellow');

		var myHash3 = new Hash({fruits: {apple: ['red', 'yellow'], lemon: ['green', 'yellow']}});
		expect(myHash3.toQueryString()).toEqual('fruits[apple][0]=red&fruits[apple][1]=yellow&fruits[lemon][0]=green&fruits[lemon][1]=yellow');
	});

});

})();

/*
---
name: Number.Format Tests
requires: [More/Number.Extras]
provides: [Number.Format.Tests]
...
*/
describe('Number.Format', function(){

	describe('Number.format', function(){

		it('should format the number', function(){

			expect((1235432.163).format({
				decimals: 1,
				group: '.',
				decimal: ',',
				suffix: '+',
				prefix: '-'
			})).toEqual('-1.235.432,2+');

		});

		it('should format a negative number', function(){
			expect((-20000).format()).toEqual('-20,000');
		});

		it('should format a negative number with a special minus sign', function(){
			expect((-20000).format({negative: {prefix:'_'}})).toEqual('_20,000');
			expect((-20000).format({negative: {suffix:'_'}})).toEqual('20,000_');
			expect((-20000).format({negative: {prefix:'_', suffix: '^'}})).toEqual('_20,000^');
		});

		it('should format with the right decimals', function(){
			expect((123.456).format({decimals: 0})).toEqual('123');
			expect((123.456).format({decimals: 1, decimal: '.'})).toEqual('123.5');
			expect((123.451).format({decimals: 2, decimal: '.'})).toEqual('123.45');
		});

		it('should change precision', function(){
			expect((123456789).format({
				precision: 4,
				scientific: false
			})).toEqual('123,500,000');

			expect((12).format({
				precision: 4,
				scientific: false
			})).toEqual('12.00');
		});

		it('should have the right amouth of zeros', function(){
			expect((1e+30).format({scientific: false})).toEqual('1,000,000,000,000,000,000,000,000,000,000');

			expect((1.2345e+30).format({scientific: false})).toEqual('1,234,500,000,000,000,000,000,000,000,000');


			expect((1e-30).format({scientific: false})).toEqual('0.000000000000000000000000000001');

			expect((1.234345e-30).format({scientific: false})).toEqual('0.000000000000000000000000000001234345');
		});

		it('should format a currency', function(){
			expect((2000).formatCurrency()).toEqual('$ 2,000.00');
			expect((2000).formatCurrency(0)).toEqual('$ 2,000');
		});

		it('should format a negative currency', function(){
			expect((-2000).formatCurrency()).toEqual('$ -2,000.00');
		});

		it('should still format a currency', function(){
			expect((2000).formatCurrency()).toEqual('$ 2,000.00');
		});

		it('should format percentage', function(){
			expect((50.123).formatPercentage()).toEqual('50.12%');
			expect((50.123).formatPercentage(1)).toEqual('50.1%');
			expect((50.123).formatPercentage(0)).toEqual('50%');
		});

		it('should not change the options object', function(){
			var options = {prefix: 'foo'};
			(-3).format(options);
			expect(options.prefix).toEqual('foo');
		});

	});


});



/*
---
name: Object.Extras Tests
requires: [More/Object.Extras]
provides: [Object.Extras.Tests]
...
*/
describe('Object.getFromPath', function(){

	it('should retrieve an object value from a path', function(){
		var obj = {
			animal: {
				human: {
					most_deadly: 'ninja'
				}
			}
		};
		expect(Object.getFromPath(obj, 'animal.human.most_deadly')).toEqual('ninja');
	});

	it('should retrieve an object value from an array', function(){
		var obj = {
			animal: {
				human: {
					most_deadly: 'ninja'
				}
			}
		};
		expect(Object.getFromPath(obj, ['animal', 'human', 'most_deadly'])).toEqual('ninja');
	});

});


describe('Object.cleanValues', function(){

	it('should filter all the null values out', function(){
		var obj = {
			animal: null,
			mootools: true,
			test: 'ing',
			no: false
		};
		expect(Object.cleanValues(obj)).toEqual({
			mootools: true,
			test: 'ing',
			no: false
		});
	});

	it('custom filter method', function(){
		var obj = {
			animal: null,
			mootools: true,
			test: 'ing',
			no: false
		};
		expect(Object.cleanValues(obj, function(obj){
			return obj !== false;
		})).toEqual({
			animal: null,
			mootools: true,
			test: 'ing'
		});
	});

});

describe('Object.erase', function(){

	it('should retrieve a hash value from a path', function(){
		var obj = {
			animal: null,
			mootools: true,
			test: 'ing',
			no: false
		};
		expect(Object.cleanValues(obj)).toEqual({
			mootools: true,
			test: 'ing',
			no: false
		});
	});

});

describe('Object.run', function(){

	it('should retrieve a hash value from a path', function(){
		var value = '';
		var obj = {
			animal: function(arg){
				value += arg;
			},
			moo: function(arg){
				value += arg;
			}
		};
		expect((function(){
			Object.run(obj, 'running');
			return value;
		})()).toEqual('runningrunning');
	});

});

/*
---
name: Object.Extras_client Tests
requires: [More/Object.Extras]
provides: [Object.Extras_client.Tests]
...
*/
describe('Object hasOwnProperty', function(){

	it('should not fail on window', function(){
		expect(function(){
			window._drinks = {milk: 'yum!'};
			Object.getFromPath(window, '_drinks.milk');
		}).not.toThrow();
	});

});

/*
---
name: String.Extras Tests
requires: [More/String.Extras]
provides: [String.Extras.Tests]
...
*/
describe('String.standardize', function(){

	it('should map special characters into standard ones', function(){
		expect('También jugué al fútbol con Martín.'.standardize()).toEqual('Tambien jugue al futbol con Martin.');
		expect('Enchanté. Très bien, merci.'.standardize()).toEqual('Enchante. Tres bien, merci.');
		expect('Jak się masz?'.standardize()).toEqual('Jak sie masz?');
	});

});

describe('String.repeat', function(){

	it('should repeat the given string a number of times', function(){
		expect('ha'.repeat(5)).toEqual('hahahahaha');
		expect('ha'.repeat(0)).toEqual('');
	});

});

describe('String.pad', function(){

	it('should work with both numbers and strings', function(){
		expect('1'.pad(2, 0, 'left')).toEqual('01');
		expect('1'.pad(2, '0', 'left')).toEqual('01');
	});

	it('should fill the string with the supplied pad string to left, right or both to reach a given number of characters', function(){
		expect('Alien'.pad(10, ' ', 'right')).toEqual('Alien     ');
		expect('Alien'.pad(10, '-=', 'left')).toEqual('-=-=-Alien');
		expect('Alien'.pad(10, '_', 'both')).toEqual('__Alien___');
		expect('Alien'.pad(6, '___', 'right')).toEqual('Alien_');
	});

});

describe('String.stripTags', function(){

	it('should remove all tags from an html string', function(){
		expect('<b>test<a>another</a><br><hr/><div>thing</div></b>'.stripTags()).toEqual('testanotherthing');
	});

	it('should leave a string w/o html alone', function(){
		expect('i like cookies'.stripTags()).toEqual('i like cookies');
	});

});

describe('String.truncate', function(){

	it('it should truncate a string at 10 chars and add ...', function(){
		expect("Just MooTooling'".truncate(10)).toEqual('Just MooTo…');
	});

	it('it should another trail, instead of the usual dots', function(){
		expect("Just MooTooling'".truncate(10, '--')).toEqual('Just MooTo--');
		expect("Just MooTooling'".truncate(10, null)).toEqual('Just MooTo');
	});

	it('should truncate a string nicely after the last given char, for example a space', function(){
		expect("Just MooTooling'".truncate(10, '--', ' ')).toEqual('Just--');
		expect("Just MooTooling'".truncate(10, null, ' ')).toEqual('Just');
	});

});

describe('String.ms', function(){

	it('should convert seconds to milliseconds', function(){
		expect('5s'.ms()).toEqual(5000);
	});

	it('should convert minutes to milliseconds', function(){
		expect('2m'.ms()).toEqual(12e4);
	});

	it('should convert hours to milliseconds', function(){
		expect('3h'.ms()).toEqual(108e5);
	});

	it('should keep milliseconds as milliseconds', function(){
		expect('250ms'.ms()).toEqual(250);
	});

	it('should treat no unit as milliseconds', function(){
		expect('100'.ms()).toEqual(100);
	});

	it('should return NaN for unknown units', function(){
		jasmine.Matchers.prototype.toBeNaN = function(){
			return isNaN(this.actual);
		};
		expect('30q'.ms()).toBeNaN();
	});

});

/*
---
name: String.QueryString Tests
requires: [More/String.QueryString]
provides: [String.QueryString.Tests]
...
*/

(function(){

	describe('String.parseQueryString', function(){

		it('should parse a query string to an object', function(){
			expect('apple=red&lemon=yellow'.parseQueryString().apple).toEqual('red');
			//verify that empty keys are ignored
			expect('apple=red&lemon=yellow&='.parseQueryString().apple).toEqual('red');
		});

		it('should parse a query string with array syntax to an array', function(){
			var apple = 'apple=red&apple=green'.parseQueryString().apple;
			expect(typeOf(apple)).toEqual('array');
			expect(apple.length).toEqual(2);
		});

		it('should parse a query string with an object to an object', function(){
			var obj = 'foo[bar][baz]=red'.parseQueryString();
			expect(obj.foo.bar.baz).toEqual('red');
		});

		it('should parse a plain string to a key', function(){
			expect('appleyellow'.parseQueryString().hasOwnProperty('appleyellow')).toEqual(true);
			expect('a=1&b'.parseQueryString().hasOwnProperty('b')).toEqual(true);
		});

		it('should parse an encoded querystring to an object', function(){
			expect('this%20should%20be%20decoded=yes'.parseQueryString()).toEqual({'this should be decoded': 'yes'});
		});

		it('should parse a querystring without decoding', function(){
			expect('this%20should%20be%20encoded=oh%20dear'.parseQueryString(false, false)).toEqual({'this%20should%20be%20encoded': 'oh%20dear'});
		});

		it('should parse a collection correctly', function(){
			expect(Hash.toQueryString('f[28][]=110&order=pv'.parseQueryString())).toEqual('f[28][]=110&order=pv');
		});

	});

	describe('String.cleanQueryString', function(){

		it('should remove empty keys', function(){
			expect('a=b&x=y&z=123&e='.cleanQueryString()).toEqual('a=b&x=y&z=123');
		});

		it('should remove specified keys', function(){
			expect('a=b&x=y&z=123&e='.cleanQueryString(function(key, value){
				return !value.match(/[0-9]/);
			})).toEqual('a=b&x=y&e=');
		});

	});


})();

/*
---
name: URI.Relative Tests
requires: [More/URI.Relative]
provides: [URI.Relative.Tests]
...
*/

(function(){

var uri;

	describe('String.toURI using relative path', function(){

		beforeEach(function(){
			uri = '/mydirectory/myfile.html?myquery=true#myhash'.toURI({ base: 'http://myuser:mypass@www.calyptus.eu:8080/' });
		});

		it('URI.toString() should be same as input combined', function(){
			expect(uri.toString()).toEqual('http://myuser:mypass@www.calyptus.eu:8080/mydirectory/myfile.html?myquery=true#myhash');
		});

		it('should have a all properties set', function(){
			expect(uri.get('scheme')).toEqual('http');
			expect(uri.get('user')).toEqual('myuser');
			expect(uri.get('password')).toEqual('mypass');
			expect(uri.get('host')).toEqual('www.calyptus.eu');
			expect(uri.get('port')).toEqual('8080');
			expect(uri.get('directory')).toEqual('/mydirectory/');
			expect(uri.get('file')).toEqual('myfile.html');
			expect(uri.get('query')).toEqual('myquery=true');
			expect(uri.get('fragment')).toEqual('myhash');
		});

	});

	describe('URI toRelative functionality', function(){
		beforeEach(function(){
			uri = new URI('http://www.calyptus.eu/mydirectory/mydirectory2/myfile.html');
		});
		it('new URI(\'../base/otherfolder\').toRelative() should return a folder up from the current location', function(){
			expect(new URI('../base/otherfolder').toRelative()).toEqual('../base/otherfolder');
		});

		it('new URI(\'../base/otherfolder\').toRelative(currentLocation) should return a folder up from the current location', function(){
			expect(new URI('../base/otherfolder').toRelative(window.location)).toEqual('../base/otherfolder');
		});

		it('URI.toRelative(string)', function(){
			expect(uri.toRelative('http://www.calyptus.eu/mydirectory/myfile.html')).toEqual('mydirectory2/myfile.html');
		});

		it('URI.toRelative(string)', function(){
			expect(uri.toRelative('http://www.calyptus.eu/mydirectory/')).toEqual('mydirectory2/myfile.html');
		});

		it('URI.toRelative(uri)', function(){
			expect(uri.toRelative(new URI('mydirectory/myfile.html', { base: 'http://www.calyptus.eu/' }))).toEqual('mydirectory2/myfile.html');
		});

		it('URI.toAbsolute(string)', function(){
			expect(uri.toAbsolute('http://www.calyptus.eu/mydirectory/myfile.html')).toEqual('/mydirectory/mydirectory2/myfile.html');
		});

		it('URI.toAbsolute(uri)', function(){
			expect(uri.toAbsolute(new URI('mydirectory/myfile.html', { base: 'http://www.calyptus.eu/' }))).toEqual('/mydirectory/mydirectory2/myfile.html');
		});

		it('URI.toRelative(string) on parent', function(){
			expect(uri.toRelative('http://www.calyptus.eu/test/myfile.html')).toEqual('../mydirectory/mydirectory2/myfile.html');
		});

		it('URI.toRelative(string) on different host', function(){
			expect(uri.toRelative('http://otherdomain/mydirectory/myfile.html')).toEqual('http://www.calyptus.eu/mydirectory/mydirectory2/myfile.html');
		});

		it('URI.toAbsolute(string) on different host', function(){
			expect(uri.toAbsolute('http://otherdomain/mydirectory/myfile.html')).toEqual('http://www.calyptus.eu/mydirectory/mydirectory2/myfile.html');
		});

		it('URI.toRelative(string) on different port', function(){
			expect(uri.toRelative('http://www.calyptus.eu:81/mydirectory/myfile.html')).toEqual('http://www.calyptus.eu/mydirectory/mydirectory2/myfile.html');
		});

		it('URI.toAbsolute(string) on different port', function(){
			expect(uri.toAbsolute('http://www.calyptus.eu:81/mydirectory/myfile.html')).toEqual('http://www.calyptus.eu/mydirectory/mydirectory2/myfile.html');
		});

		it('URI.toRelative(string) with query', function(){
			expect(new URI('http://www.calyptus.eu/mydirectory/mydirectory2/myfile.html?myquery=q').toRelative('http://www.calyptus.eu/mydirectory/myfile.html')).toEqual('mydirectory2/myfile.html?myquery=q');
		});

		it('URI.toAbsolute(string) with query', function(){
			expect(new URI('http://www.calyptus.eu/mydirectory/mydirectory2/myfile.html?myquery=q').toAbsolute('http://www.calyptus.eu/mydirectory/myfile.html')).toEqual('/mydirectory/mydirectory2/myfile.html?myquery=q');
		});

		it('URI.toRelative(string) to same file', function(){
			expect(uri.toRelative('http://www.calyptus.eu/mydirectory/mydirectory2/myfile.html')).toEqual('myfile.html');
		});

		it('URI.toRelative(string) to same path', function(){
			expect(new URI('http://www.calyptus.eu').toRelative('http://www.calyptus.eu')).toEqual('./');
		});

	});

})();

/*
---
name: URI Tests
requires: [More/URI]
provides: [URI.Tests]
...
*/

(function(){

	var uri;

	describe('URI initialize', function(){

		it('new URI() should return the current location', function(){
			expect(new URI().toString()).toEqual(window.location.href.replace(/#$|\?$|\?(?=#)/, ''));
		});

		it('new URI(\'http://www.calyptus.eu\') should return itself with a trailing slash', function(){
			expect(new URI('http://www.calyptus.eu').toString()).toEqual('http://www.calyptus.eu/');
		});

		it('new URI(\'http://www.calyptus.eu/\') should return itself', function(){
			expect(new URI('http://www.calyptus.eu/').toString()).toEqual('http://www.calyptus.eu/');
		});

		it('\'http://www.calyptus.eu/\' + \'./mydirectory/myfile.html\' == http://www.calyptus.eu/mydirectory/myfile.html', function(){
			expect(new URI('./mydirectory/myfile.html', { base: 'http://www.calyptus.eu/' }).toString()).toEqual('http://www.calyptus.eu/mydirectory/myfile.html');
		});

		it('\'http://www.calyptus.eu\' + \'mydirectory/myfile.html\' == http://www.calyptus.eu/mydirectory/myfile.html', function(){
			expect(new URI('mydirectory/myfile.html', { base: 'http://www.calyptus.eu' }).toString()).toEqual('http://www.calyptus.eu/mydirectory/myfile.html');
		});

		it('\'http://www.calyptus.eu/mydirectory/#\' + \'../myfile.html\' == http://www.calyptus.eu/myfile.html', function(){
			expect(new URI('../myfile.html', { base: 'http://www.calyptus.eu/mydirectory/#' }).toString()).toEqual('http://www.calyptus.eu/myfile.html');
		});

		it('\'http://www.calyptus.eu/mydirectory/mydirectory2/\' + \'../../myfile.html\' == http://www.calyptus.eu/myfile.html', function(){
			expect(new URI('../../myfile.html', { base: 'http://www.calyptus.eu/mydirectory/mydirectory2/' }).toString()).toEqual('http://www.calyptus.eu/myfile.html');
		});

		it('\'http://www.calyptus.eu/mydirectory/mydirectory2/\' + \'../test/../myfile.html\' == http://www.calyptus.eu/mydirectory/myfile.html', function(){
			expect(new URI('../test/../myfile.html', { base: 'http://www.calyptus.eu/mydirectory/mydirectory2/' }).toString()).toEqual('http://www.calyptus.eu/mydirectory/myfile.html');
		});

		it('\'http://www.calyptus.eu/\' + \'http://otherdomain/mydirectory/myfile.html\' == http://otherdomain/mydirectory/myfile.html', function(){
			expect(new URI('http://otherdomain/mydirectory/myfile.html', { base: 'http://www.calyptus.eu/' }).toString()).toEqual('http://otherdomain/mydirectory/myfile.html');
		});

		it('\'http://www.calyptus.eu/mydirectory2/myfile.html\' + \'/mydirectory/myfile.html\' == http://www.calyptus.eu/mydirectory/myfile.html', function(){
			expect(new URI('/mydirectory/myfile.html', { base: 'http://www.calyptus.eu/mydirectory2/myfile.html' }).toString()).toEqual('http://www.calyptus.eu/mydirectory/myfile.html');
		});

		it('\'http://www.calyptus.eu/mydirectory2/\' + \'mydirectory/myfile.html\' == http://www.calyptus.eu/mydirectory2/mydirectory/myfile.html', function(){
			expect(new URI('mydirectory/myfile.html', { base: 'http://www.calyptus.eu/mydirectory2/myfile.html' }).toString()).toEqual('http://www.calyptus.eu/mydirectory2/mydirectory/myfile.html');
		});

		it('\'http://www.calyptus.eu/mydirectory2/\' + \'mydirectory\' == http://www.calyptus.eu/mydirectory2/mydirectory', function(){
			expect(new URI('mydirectory', { base: 'http://www.calyptus.eu/mydirectory2/myfile.html' }).toString()).toEqual('http://www.calyptus.eu/mydirectory2/mydirectory');
		});

		it('\'http://www.calyptus.eu/mydirectory/mydirectory2/myfile.html\' + \'..\' == http://www.calyptus.eu/mydirectory/', function(){
			expect(new URI('..', { base: 'http://www.calyptus.eu/mydirectory/mydirectory2/myfile.html' }).toString()).toEqual('http://www.calyptus.eu/mydirectory/');
		});

		it('Query String can contain @ symbol', function(){
			expect(new URI('http://www.calyptus.eu/myfile.html?email=somebody@gmail.com').get('host')).toEqual('www.calyptus.eu');
		});

	});

	describe('URI methods without query in url', function(){

		beforeEach(function(){
			uri = new URI('http://www.calyptus.eu/mydirectory/mydirectory2/myfile.html');
		});

		it('URI.toString() should be same as input', function(){
			expect(uri.toString()).toEqual('http://www.calyptus.eu/mydirectory/mydirectory2/myfile.html');
		});

		it('URI.setData({ keyName: \'my value\' }) should return ?keyName=my%20value as the query', function(){
			uri.setData('keyName', 'myOtherValue');
			expect(uri.get('query')).toEqual('keyName=myOtherValue');
			uri.setData({ keyName: 'my value' });
			expect(uri.get('query')).toEqual('keyName=my%20value');
		});
	});

	describe('URI methods with query in url', function(){

		beforeEach(function(){
			uri = new URI('http://www.calyptus.eu/mydirectory/mydirectory2/myfile.html?keyName=my%20value');
		});
        
		it('URI.getData() should return an object with the value set above', function(){
			expect(uri.getData().keyName).toEqual('my value');
		});

		it('URI.getData(\'keyName\') should return the string with the value set above', function(){
			expect(uri.getData('keyName')).toEqual('my value');
		});

	});

	describe('URI use where string is expected', function(){

		it('Request self should work with an URI object', function(){
			new Request({url: new URI()}).get();
		});

		it('A HREF should take an URI object', function(){
			expect(new Element('a').set('href', new URI()).get('href')).toEqual(new URI().toString());
		});

		it('post-concatenation with string', function(){
			expect(new URI('http://www.calyptus.eu/') + '?test').toEqual('http://www.calyptus.eu/?test');
		});

		it('pre-concatenation with string', function(){
			expect('URL: ' + new URI('http://www.calyptus.eu/')).toEqual('URL: http://www.calyptus.eu/');
		});

		it('regexp test', function(){
			expect(/^http/.test(new URI('http://www.calyptus.eu/'))).toEqual(true);
		});

	});

	describe("URI merging", function () {

		var myURI;
		beforeEach(function () {
			myURI = new URI('http://user:password@www.test.com:8383/the/path.html?param=value&animal=cat#car=ferrari');
		});

		it("should retrieve the 'fragment' part", function () {
			expect(myURI.get('fragment')).toEqual('car=ferrari');
		});

		it("should insert new data into 'fragment'", function () {
			myURI.setData({
				color: 'blue'
			}, true, 'fragment')
			expect(myURI.get('fragment')).toEqual('car=ferrari&color=blue');
		});

		it("should merge values from setData into URI overriding old keys with new value", function () {

			var inicialQuery = myURI.get('query');
			expect(inicialQuery).toEqual('param=value&animal=cat');

			myURI.setData({
				foo: 'bar',
				animal: 'dog'
			}, true);
			var finalQuery = myURI.get('query');
			expect(finalQuery).toEqual('param=value&animal=dog&foo=bar');

		});
	});

})();

/*
---
name: Assets Tests
requires: [More/Assets]
provides: [Assets.Tests]
...
*/
describe('Assets', function(){

	describe('Assets.javascript', function(){

		it('should load a javascript file and fire the load event', function(){

			var load = jasmine.createSpy('load');

			var myScript = Asset.javascript('base/Tests/Specs/assets/Assets.js.test.js', {
				id: 'myScript',
				onload: function(){
					load(this);
				}
			});

			waits(800);

			runs(function(){
				expect(myScript.get('tag')).toEqual('script');
				expect(myScript.id).toEqual('myScript');
				expect(load).toHaveBeenCalledWith(myScript);
				expect(load.callCount).toEqual(1);
				myScript.destroy();
			});

		});
	});

	describe('Assets.css', function(){

		function addCSS(source, load){
			new Element('div', {
				id: 'moologo'
			}).inject($(document.body));

			return myCSS = Asset.css(source, {
				id: 'myStyle',
				title: 'myStyle',
				onLoad: function(){
					load(this);
				}
			});
		}
		
		afterEach(function(){
			$('myStyle').destroy();
			$('moologo').destroy();
		});

		it('should load a external css file and run load callback', function(){
			var load = jasmine.createSpy('load');
			var url = 'https://rawgit.com/mootools/mootools-more/master/Tests/Specs/assets/Assets.css.test.css';
			var myCSS = addCSS(url, load);
			var myCSS = addCSS(url, load);

			waits(3000);
			runs(function(){
				expect(myCSS.get('tag')).toEqual('link');
				expect(myCSS.id).toEqual('myStyle');
				expect(load).toHaveBeenCalledWith(myCSS);
				load = myCSS = null;
			});
		});

		it('should load a local css file and run load callback', function(){
			var load = jasmine.createSpy('load');
			var url = 'base/Tests/Specs/assets/Assets.css.test.css';
			var myCSS = addCSS(url, load);

			waits(2000);
			runs(function(){
				var border = $('moologo').getStyle('border');
				expect(load).toHaveBeenCalledWith(myCSS);
				expect(myCSS.get('tag')).toEqual('link');
				expect(myCSS.id).toEqual('myStyle');
				expect(border.contains('4px solid')).toBeTruthy();
				load = myCSS = null;
			});
		});
	});

	describe('Assets.image', function(){

		it('should load a image', function(){

			var load = jasmine.createSpy('load');

			var myImage = Asset.image('base/Tests/Specs/assets/mootools.png', {
				id: 'myImage',
				title: 'myImage',
				onload: load
			});

			waits(800);

			runs(function(){
				expect(myImage.get('tag')).toEqual('img');
				expect(myImage.id).toEqual('myImage');
				expect(load).toHaveBeenCalledWith(myImage);
				expect(myImage.width).toEqual(230);
				expect(myImage.height).toEqual(54);
				myImage.destroy();
			});

		});

		it('should fire the error event', function(){

			var load = jasmine.createSpy('load'),
				error = jasmine.createSpy('error');

			var myImage = Asset.image('base/Tests/Specs/assets/notExisting.png',{
				onload: load,
				onerror: error
			});

			waits(800);

			runs(function(){
				expect(load).not.toHaveBeenCalled();
				expect(error).toHaveBeenCalledWith(myImage);
				myImage.destroy();
			});

		});

		it('should fire the load event twice when loading the same image', function(){

			var loadedagain = jasmine.createSpy('load'),
				myImage1;

			var loaded = function(){
				myImage1 = Asset.image('base/Tests/Specs/assets/mootools.png', {
					onload: loadedagain
				});
			};

			var myImage = Asset.image('base/Tests/Specs/assets/mootools.png', {
				onload: loaded
			});

			waits(800);

			runs(function(){
				expect(loadedagain).toHaveBeenCalled();
				myImage.destroy();
				if (myImage1) myImage1.destroy();
			});
		});

		xit('should fire the error event when the source argument is empty', function(){

			var load = jasmine.createSpy('load'),
				error = jasmine.createSpy('error');

			var myImage = Asset.image('', {
				onload: load,
				onerror: error
			});

			waits(800);

			runs(function(){
				expect(load).not.toHaveBeenCalled();
				expect(error).toHaveBeenCalledWith(myImage);
				myImage.destroy();
			});
		});
	});

	describe('Assets.images', function(){

		it('shoud load several images', function(){

			var complete = jasmine.createSpy('complete'),
				progress = jasmine.createSpy('progress'),
				error = jasmine.createSpy('error');

			var loadedImages = new Asset.images([
				'base/Tests/Specs/assets/cow.png',
				'base/Tests/Specs/assets/mootools.png'
			], {
				onComplete: complete,
				onProgress: progress,
				onError: error
			});

			waits(800);

			runs(function(){
				expect(complete).toHaveBeenCalled();
				expect(progress.callCount).toEqual(2);
				expect(error).not.toHaveBeenCalled();
			});

		});

		it('should should fire the onError callback for non-existent images and empty sources', function(){

			var complete = jasmine.createSpy('complete'),
				progress = jasmine.createSpy('progress'),
				error = jasmine.createSpy('error');

			var loadedImages = new Asset.images([
				'base/Tests/Specs/assets/iDontExist.png',
				'base/Tests/Specs/assets/cow.png',
				'base/Tests/Specs/assets/iDontExistEither.png'
			], {
				onComplete: complete,
				onProgress: progress,
				onError: error
			});

			waits(800);

			runs(function(){
				expect(complete).toHaveBeenCalled();
				expect(progress.callCount).toEqual(1);
				expect(error.callCount).toEqual(2);
			});
		});
	});
});

/*
---
name: Color Tests
requires: [More/Color]
provides: [Color.Tests]
...
*/
describe('Color initialize', function(){

	it('Should initialize a color from a hex value', function(){
		expect(new Color('#000').toString()).toEqual('0,0,0');
	});

	it('Should initialize a color from a RGB array', function(){
		expect(new Color([255,0,255]).toString()).toEqual('255,0,255');
	});

});

describe('Color properties', function(){

	it('Should define the rgb value for a color', function(){
		expect(new Color("#ff00ff").rgb).toEqual([255,0,255]);
	});

	it('Should define the hsb value for a color', function(){
		expect(new Color("#ff00ff").hsb).toEqual([300, 100, 100]);
	});

	it('Should define the hex value for a color', function(){
		expect(new Color([255,0,255]).hex).toEqual("#ff00ff");
	});


});

describe('Color mutation', function(){

	it('Should invert a color', function(){
		expect(new Color('#000').invert().toString()).toEqual('255,255,255');
	});

	it('Should mix a color', function(){
		expect(new Color('#000').mix('#fff').toString()).toEqual('127,127,127');
	});

	it('Should set the hue of a color', function(){
		expect(new Color('#700').setHue(300).toString()).toEqual('120,0,120');
	});

	it('Should set the saturation of a color', function(){
		expect(new Color('#700').setSaturation(50).toString()).toEqual('120,60,60');
	});

	it('Should set the brightness of a color', function(){
		expect(new Color('#700').setBrightness(70).toString()).toEqual('179,0,0');
	});

});

describe('Color $methods', function(){

	it('Tests $RGB', function(){
		expect(Array.from($RGB(127, 0, 0))).toEqual([127,0,0]);
	});

	it('Tests $HSB', function(){
		expect(Array.from($HSB(50, 50, 100))).toEqual([255,234,128]);
	});

	it('Tests $HEX', function(){
		expect(Array.from($HEX('#700'))).toEqual([281,0,0]);
	});

});



/*
---
name: Group Tests
requires: [More/Group]
provides: [Group.Tests]
...
*/
describe('Group', function(){

	it('should fire an event if all the events are fired of each instance', function(){

		var callback = jasmine.createSpy();

		var instances = [new Events(), new Events(), new Events()];

		new Group(instances).addEvent('complete', callback);

		var l = instances.length;
		while (l--) instances[l].fireEvent('complete');

		expect(callback).toHaveBeenCalled();

	});

});

/*
---
name: Hash.Cookie Tests
requires: [More/Hash.Cookie]
provides: [Hash.Cookie.Tests]
...
*/
describe('Hash.Cookie', function(){

	beforeEach(function(){
		this.hc = new Hash.Cookie('HCtest');
	});

	afterEach(function(){
		this.hc.dispose().load();
	});

	it('Saves a set of key/values into a cookie', function(){
		var hc = this.hc;
		hc.set('foo', 'bar');
		hc.extend({
			apple: 'red',
			lemon: 'yellow'
		});
		expect(hc.get('apple')).toEqual('red');
		expect(hc.get('foo')).toEqual('bar');
		expect(hc.get('lemon')).toEqual('yellow');
	});

	it('Retrieves a Hash.Cookie', function(){
		this.hc.set('pomme', 'rouge');
		var hc2 = new Hash.Cookie('HCtest');// order matters here 
		expect(hc2.get('pomme')).toEqual('rouge');
	});

	it('Removes a Hash.Cookie', function(){
		var hc = this.hc;

		hc.set('apple', 'green');
		hc.dispose().load();// destroy cookie then update hash
 
		expect(hc.get('apple')).toEqual(null);
	});

});

describe('Color properties', function(){

	it('Should define the rgb value for a color', function(){
		expect(new Color("#ff00ff").rgb).toEqual([255,0,255]);
	});

	it('Should define the hsb value for a color', function(){
		expect(new Color("#ff00ff").hsb).toEqual([300, 100, 100]);
	});

	it('Should define the hex value for a color', function(){
		expect(new Color([255,0,255]).hex).toEqual("#ff00ff");
	});


});

/*
---
name: Table Tests
requires: [More/Table]
provides: [Table.Tests]
...
*/
describe('Table', function(){

	var table = new Table();
	var one = 1;
	var obj = {};
	var fn = function(){};

	it('Adds a values to a Table instance', function(){
		expect(table.length).toEqual(0);
		table.set('foo', 'bar');
		expect(table.length).toEqual(1);
		table.set(one, 'one');
		table.set(fn, 'function');
		table.set(obj, 'an object');
		expect(table.get('foo')).toEqual('bar');
		expect(table.get(one)).toEqual('one');
		expect(table.get(fn)).toEqual('function');
		expect(table.get(obj)).toEqual('an object');
		expect(table.length).toEqual(4);
	});

	it('Iterates over a Table instance', function(){
		var keys = [];
		var values = [];
		table.each(function(key, val){
			keys.push(key);
			values.push(val);
		});
		expect(keys).toEqual(['foo', one, fn, obj]);
		expect(values).toEqual(['bar', 'one', 'function', 'an object']);
	});

	it('Removes values from a Table instance', function(){
		expect(table.length).toEqual(4);
		table.erase('foo');
		expect(table.length).toEqual(3);
		table.erase(one);
		table.erase(fn);
		table.erase(obj);
		expect(table.get('foo')).toEqual(null);
		expect(table.get(one)).toEqual(null);
		expect(table.get(fn)).toEqual(null);
		expect(table.get(obj)).toEqual(null);
		expect(table.length).toEqual(0);
	});

});
