(function() {
  "use strict";

  // React animated SVG clock starts here

  // setup some variables so you can play around with it
  var svgElement         = document.getElementById('clock_svg'),
      clockElement       = document.getElementById('clock'),
      clockworkElement   = document.getElementById('clockwork'),
      svgWidth           = 400,
      svgHeight          = 400,
      centerX            = Math.round(svgWidth / 2),
      centerY            = Math.round(svgHeight / 2),
      CLOCK_R            = Math.round(svgHeight * 0.4),
      CLOCK_STROKE       = '#aaa',
      CLOCK_FILL         = '#eee',
      CENTER_DOT_SIZE    = 8,
      CENTER_DOT_FILL    = '#fff',
      HAND_COLOR         = '#888',
      HOUR_STEP_HEIGHT   = 8,
      HOUR_STEP_WIDTH    = 4,
      MINUTE_STEP_HEIGHT = 4,
      MINUTE_STEP_WIDTH  = 1,
      SECONDS_HAND_WIDTH = 1,
      MINUTE_HAND_WIDTH  = 4,
      HOUR_HAND_WIDTH    = 5;

  // for clean writing some minor helpers
  var rotateTransformValue = function(rotation) {
    return [
      'rotate(',
        rotation,
        ' ',centerY,
        ' ',centerX,
      ')'
    ].join('');
  };

  var toDegrees = function(value, max, multiplier) {
    return (value % max) * multiplier;
  };

  var composeToDegreesConverter = function(max) {
    var multiplier = 360/max;
    return function(value) {
      return toDegrees(value, max, multiplier);
    };
  };

  var composeOffsetDegreesConverter = function(options) {
    var offsetUnit = options.offsetUnit;
    var masterUnitDegrees = 360/options.masterUnit;
    return function(value) {
      return (masterUnitDegrees / offsetUnit) * value;
    };
  };

  var shiftDegrees = function(degrees, shift) {
    return (degrees + shift) % 360;
  };

  // compose helpers for "to degrees"
  var secondsToDegrees = composeToDegreesConverter(60);
  var hoursToDegrees   = composeToDegreesConverter(12);
  var minuteToDegrees  = composeToDegreesConverter(60);

  // compose helpers for offset degrees
  var secondsMillisecondOffsetDegrees = composeOffsetDegreesConverter({ masterUnit: 60, offsetUnit: 1000 });
  var minutesSecondsOffsetDegrees     = composeOffsetDegreesConverter({ masterUnit: 60, offsetUnit: 60 });
  var hoursMinutesOffsetDegrees       = composeOffsetDegreesConverter({ masterUnit: 12, offsetUnit: 60 });

  // Helper for generating ID's (React child elements want those)
  // more on about 'keys': http://facebook.github.io/react/docs/multiple-components.html#dynamic-children
  // This function returns an increasing number with a custom prefix if given
  var generateID = function() {
    var _id = 0;
    return function(prefix) {
      return [prefix || '_', (_id++)].join('');
    };
  }();


  // Render the "clock" itself (just once)
  var Clock = React.createClass({
    // helper for indicatorElements
    addStepElement: function(options, step) {
      return React.DOM.rect({
        key       : generateID(options.stepID),
        x         : centerX - (options.stepWidth / 2),
        y         : CLOCK_R + centerY - options.stepHeight,
        fill      : HAND_COLOR,
        height    : options.stepHeight,
        width     : options.stepWidth,
        transform : rotateTransformValue(options.stepRotation * step)
      });
    },

    // helper for generating the indicators easily (for minutes and hours)
    // returns an array of React.DOM.rect's
    indicatorElements: function(options) {
      options.stepRotation = 360/options.steps;
      options.stepID       = generateID("step");

      var elements = [];

      for (var step = 0, max = options.steps; step < max; step++) {
        elements.push(this.addStepElement(options, step));
      }

      return elements;
    },

    // helper for the two circles (clock itself and the center dot)
    // returns a React.DOM.circle
    centeredCircleElement: function(options) {
      return React.DOM.circle({
        key         : generateID('circ'),
        cx          : centerX,
        cy          : centerY,
        r           : options.r,
        fill        : options.fill,
        strokeWidth : 4,
        stroke      : options.stroke
      });
    },

    render: function() {
      var elements = [
        // circle surrounding the clockwork and filling the background
        this.centeredCircleElement({
          fill   : CLOCK_FILL,
          stroke : CLOCK_STROKE,
          r      : CLOCK_R
        }),

        // dot in the center
        this.centeredCircleElement({
          fill   : CENTER_DOT_FILL,
          stroke : HAND_COLOR,
          r      : CENTER_DOT_SIZE
        }),
      ];

      // hour indicators
      elements = elements.concat(
          this.indicatorElements({
            steps      : 12,
            stepHeight : HOUR_STEP_HEIGHT,
            stepWidth  : HOUR_STEP_WIDTH
          })
      );

      // minute indicators
      elements = elements.concat(
        this.indicatorElements({
          steps      : 60,
          stepHeight : MINUTE_STEP_HEIGHT,
          stepWidth  : MINUTE_STEP_WIDTH
        })
      );

      return React.DOM.g({}, elements);
    }
  });
  React.render(React.createElement(Clock, {}), clockElement);


  // Render the "clockwork" via requestanimationframe
  var Clockwork = React.createClass({
    handElement: function(options) {
      var halfWidth  = options.width / 2;
      return React.DOM.rect({
        key       : generateID('hand-'),
        x         : centerX - halfWidth,
        y         : centerY + CENTER_DOT_SIZE,
        fill      : HAND_COLOR,
        height    : options.height - CENTER_DOT_SIZE,
        width     : options.width,
        transform : rotateTransformValue(shiftDegrees(options.rotateDegrees, 180))
      });
    },

    render: function() {
      var date     = this.props.date,
          seconds  = date.getSeconds(),
          hours    = date.getHours(),
          minutes  = date.getMinutes(),
          mseconds = date.getMilliseconds();

      var secondsDegrees = secondsToDegrees(seconds) + secondsMillisecondOffsetDegrees(mseconds),
          minuteDegrees  = minuteToDegrees(minutes) + minutesSecondsOffsetDegrees(seconds),
          hourDegrees    = hoursToDegrees(hours) + hoursMinutesOffsetDegrees(minutes);

      return React.DOM.g({}, [
        // seconds hand
        this.handElement({
          rotateDegrees : secondsDegrees,
          width         : SECONDS_HAND_WIDTH,
          height        : CLOCK_R * 0.93
        }),

        // minutes hand
        this.handElement({
          rotateDegrees : minuteDegrees,
          width         : MINUTE_HAND_WIDTH,
          height        : CLOCK_R * 0.9
        }),

        // hours hand
        this.handElement({
          rotateDegrees : hourDegrees,
          width         : HOUR_HAND_WIDTH,
          height        : CLOCK_R * 0.6
        })

      ]);
    }
  });

  // As an example;
  // put it in a factory and demonstrate props usage (see the date beeing passed)
  var ClockworkFactory = React.createFactory(Clockwork);

  requestAnimationFrame(function render() {
    React.render(
      new ClockworkFactory({ date: new Date() }),
      clockworkElement);
    requestAnimationFrame(render);
  }, 1000/30);
})();