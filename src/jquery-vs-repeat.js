/**
 * Copyright Kamil Pękala http://github.com/kamilkp
 * jQuery Virtual Scroll Repeat v0.0.1 2014/09/22
 */

(function(window, $){
	'use strict';
	/* jshint eqnull:true */
	/* jshint -W038 */

	$.fn.vsRepeat = function(config){
		var $element = $(this[0]);
		var array = config.data;

		var positioningProperty = config.direction === 'horizontal' ? 'left' : 'top';
		var clientSize =  config.direction === 'horizontal' ? 'clientWidth' : 'clientHeight';
		var offsetSize =  config.direction === 'horizontal' ? 'offsetWidth' : 'offsetHeight';
		var scrollPos =  config.direction === 'horizontal' ? 'scrollLeft' : 'scrollTop';
		var $scrollParent = config.scrollParent ? $element.closest(config.scrollParent) : $element;

		var tpl = $element.children().first()[0].outerHTML;
		var matches = tpl.match(/#.+?#/g);
		var elementSize;
		var $fillElement;
		var $wheelHelper;

		var startIndex = 0;
		var endIndex = 1;
		var offsetBefore = config.offsetBefore || 0;
		var offsetAfter = config.offsetAfter || 0;
		var excess = config.excess || 0;
		var sizesPropertyExists = config.sizeProperty != null;
		var sizeProperty = config.sizeProperty;
		var sizesCumulative;
		var sizes;
		var onRender = typeof config.onRender === 'function' ? config.onRender : function(){};

		if($element.css('position') === 'static')
			$element.css('position', 'relative');

		function refresh(startIndex, endIndex){
			$element.children(':not(.vs-repeat-fill-element)').remove();
			array.slice(startIndex, endIndex).forEach(function(dataItem, index){
				var match;
				var html = tpl;
				matches.forEach(function(match){
					html = html.replace(match, getModelFromMatch(match, dataItem));
				});
				var $item = $(html).appendTo($element);
				$item.attr('data-index', startIndex + index);
				if(elementSize != null || sizesCumulative != null){
					$item.css('position', 'absolute');
					if(sizesPropertyExists){
						$item.css(positioningProperty, sizesCumulative[startIndex + index] + offsetBefore);
						$item.css('height', dataItem[sizeProperty]);
					}
					else
						$item.css(positioningProperty, (startIndex + index)*elementSize + offsetBefore);
					onRender($item, index, startIndex, endIndex);
				}
				else{
					if(sizesPropertyExists){
						sizes = array.map(function(item){
							return item[sizeProperty];
						});
						var sum = 0;
						sizesCumulative = sizes.map(function(size){
							var res = sum;
							sum += (+size);
							return res;
						});
						sizesCumulative.push(sum);
					}
					else
						elementSize = $item.outerHeight();
					initializeFillElementAndWheelHelper();
					$scrollParent.on('scroll', updateInnerCollection);
				}
			});

		}

		function initializeFillElementAndWheelHelper(){
			var baseHeight = sizesPropertyExists ? sizesCumulative[array.length] : array.length * elementSize;
			$fillElement = $('<div class="vs-repeat-fill-element"></div>')
				.css({
					'position':'relative',
					'min-height': '100%',
					'min-width': '100%',
					'height': baseHeight + offsetBefore + offsetAfter
				});
			$element.prepend($fillElement);
			if(isMacOS){
				var _prevMouse = {};
				$wheelHelper = $('<div class="vs-repeat-wheel-helper"></div>')
					.on(wheelEventName, function(e){
						e.preventDefault();
						e.stopPropagation();
						if(e.originalEvent) e = e.originalEvent;
						$scrollParent[0].scrollLeft += (e.deltaX || -e.wheelDeltaX);
						$scrollParent[0].scrollTop += (e.deltaY || -e.wheelDeltaY);
					}).on('mousemove', function(e){
						if(_prevMouse.x !== e.clientX || _prevMouse.y !== e.clientY)
							$(this).css('display', 'none');
						_prevMouse = {
							x: e.clientX,
							y: e.clientY
						};
					}).css('display', 'none');
				$fillElement.append($wheelHelper);

				$scrollParent.on(wheelEventName, wheelHandler);
			}

			function wheelHandler(e){
				var elem = e.currentTarget;
				if(elem.scrollWidth > elem.clientWidth || elem.scrollHeight > elem.clientHeight)
					$wheelHelper.css('display', 'block');
			}
		}

		function updateInnerCollection(){
			if(sizesPropertyExists){
				startIndex = 0;
				while(sizesCumulative[startIndex] < $scrollParent[0][scrollPos] - offsetBefore)
					startIndex++;
				if(startIndex > 0) startIndex--;

				endIndex = startIndex;
				while(sizesCumulative[endIndex] < $scrollParent[0][scrollPos] - offsetBefore + $scrollParent[0][clientSize])
					endIndex++;
			}
			else{
				startIndex = Math.max(
					Math.floor(
						($scrollParent[0][scrollPos] - offsetBefore) / elementSize + excess/2
					) - excess,
					0
				);

				endIndex = Math.min(
					startIndex + Math.ceil(
						$scrollParent[0][clientSize] / elementSize
					) + excess,
					array.length
				);
			}
			refresh(startIndex, endIndex);
		}

		refresh(startIndex, endIndex);
		setTimeout(function(){
			updateInnerCollection();
		});

		// debug
		// window.rr = refresh;
	};

	function getModelFromMatch(match, dataItem){
		match = match.substring(1, match.length - 1);
		var props = match.split('.');
		var data = dataItem;
		props.forEach(function(prop){
			data = data[prop];
		});
		return data;
	}

	var isMacOS = navigator.appVersion.indexOf('Mac') != -1,
		wheelEventName = typeof window.onwheel !== 'undefined' ? 'wheel' : typeof window.onmousewheel !== 'undefined' ? 'mousewheel' : 'DOMMouseScroll';

	$(document.head).append([
		'<style>' +
		'.vs-repeat-wheel-helper{' +
			'position: absolute;' +
			'top: 0;' +
			'bottom: 0;' +
			'left: 0;' +
			'right: 0;' +
			'z-index: 99999;' +
			'background: rgba(0, 0, 0, 0);' +
		'}' +
		'.vs-repeat-repeated-element{' +
			'position: absolute;' +
			'z-index: 1;' +
		'}' +
		'</style>'
	].join(''));
})(window, jQuery);