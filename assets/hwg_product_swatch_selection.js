var optionsMapAvailableEventReceived = false;
(function () {
    var $productForm = $('.product-form-container').find('.product_form');
    var JSONData = $productForm.data('product');
    var productID = JSONData.id;
    var productSection = '.product-' + productID + ' .js-product_section';
    if (!(JSONData && JSONData.options && JSONData.options.length)) {
        return;
    }

    if (JSONData && JSONData.variants && JSONData.variants.length === 1) {
        return;
    }

    var optionsMap = Shopify.optionsMap;

    if (JSONData.options.length === 1 && !optionsMap) {
        optionsMap = {};
        for (var i = 0; i < JSONData.variants.length; i++) {
            var variant = JSONData.variants[i];

            if (variant.available) {
                // Gathering values for the 1st drop-down.
                var key = variant.option1;
                optionsMap[key] = optionsMap[key] || [];
                optionsMap[key].push(variant.option1);
            }
        }
        setTimeout(function () { $(document).trigger('optionsMapAvailable'); }, 500)
    }

    // hide all unavailable option when the page loads
    $('.option-unavailable').hide();

    function updateOptionsInSelector(selectorIndex, parent) {
        console.log("updateOptionsInSelector", selectorIndex)
        var selectorKey = selectorIndex === 0 ? 1 : 0;
        var key = $(parent + ' .single-option-selector:eq(' + selectorIndex + ')').val();
        var otherSelectedKey = $(parent + ' .single-option-selector:eq(' + selectorKey + ')').val();
        var selector = $(parent + ' .single-option-selector:eq(' + selectorKey + ')');


      console.log({optionsMap, key, selectorIndex})
        let removeSoldoutClass = true;
        let availableOptions = [];
        if (selectorIndex === 0) {
            availableOptions = optionsMap[key];
            if (!availableOptions && JSONData.options.length === 1) {
                availableOptions = Object.keys(optionsMap);
                removeSoldoutClass = false;
            } else if(!availableOptions) {
            	availableOptions = [];
            }
        } else if (selectorIndex === 1) {
            for (var k in optionsMap) {
                if (optionsMap[k].includes(key)) {
                    availableOptions.push(k);
                }
            }
        }

        //         unselectAllSwatchOptions(parent, selectorIndex);
        var currentSwatch = $(`${parent} .swatch[data-option-index=${selectorIndex}] .swatch-element[data-value='${key}']`);
        var currentSwatchValue = currentSwatch.data('value');

        // remove soldout from all swatch options
        if (JSONData.options.length > 1) {
            $(`${parent} .swatch[data-option-index=${selectorIndex}] .swatch-element`).each(function () {
                setTimeout(() => {
                    $(this).removeClass('soldout');
                }, 0)
            });
        }

        // remove soldout from current selection
        //         if (currentSwatch.hasClass('soldout') && availableOptions.length && removeSoldoutClass) {          
        //             currentSwatch.removeClass('soldout');
        //         }


        // if other swatch doesn't have the option available, remove the selection
        // console.log({availableOptions, otherSelectedKey})
        if (!availableOptions.includes(otherSelectedKey)) {
            unselectAllSwatchOptions(parent, selectorKey)
        }

        $('.option-unavailable[data-index=' + selectorIndex + ']').show();
        $('.option-unavailable[data-index=' + selectorIndex + '] span').addClass('selected').html(currentSwatchValue);

        // hide "choose one" text
        $(parent + ' .swatch[data-option-index="' + selectorKey + '"] .swatch-element').each(function () {
            const currentValue = $(this).attr('data-value');
            // console.log({ currentValue, ss: availableOptions.includes(currentValue) });
            if (availableOptions.includes(currentValue)) {
                // console.log("includes", currentValue);
                setTimeout(() => {
                    $(this).removeClass('soldout').find(':radio').removeAttr('disabled', 'disabled').removeAttr('checked');
                }, 0);
            } else {
                setTimeout(() => {
                    $(this).addClass('soldout');
                }, 0);
            }
        });


    }

    function unselectAllSwatchOptions(parent, selectorKey) {
        //         console.log("unselectAllSwatchOptions:start", parent, selectorKey);
        var ele = $('.swatch_options .swatch[data-option-index="' + selectorKey + '"] input')
        setTimeout(function () {
            for (var i = 0; i < ele.length; i++) {
                ele[i].checked = false;
                ele[i].disabled = false;
            }
            $(parent + ' .single-option-selector:eq(' + selectorKey + ')').val('');
        }, 0);

        $('.option-unavailable[data-index=' + selectorKey + ']').show();
        $('.option-unavailable[data-index=' + selectorKey + '] span').removeClass('selected').html('Choose One');
    }


    // the script will run on when the optionsMapAvailable event is fired on the document
    $(document).on('optionsMapAvailable', function () {
        if (optionsMapAvailableEventReceived) return;

        optionsMapAvailableEventReceived = true;

        optionsMap = Shopify.optionsMap || optionsMap;

        let parent = ".product-" + productID + " .js-product_section";


        // attaching change event listener on the first option
        $(parent + " .single-option-selector:eq(0)").change(function () {
            updateOptionsInSelector(0, parent);
        });

        // attaching change event listener on the second option
        $(parent + " .single-option-selector:eq(1)").change(function () {
            updateOptionsInSelector(1, parent);
        });


        var params = new URLSearchParams(location.search);
        var variantAvailableOnLoad = false;
        var selectedVariantId = params.get('variant');
        if (selectedVariantId) {
            let variant = JSONData.variants.filter(v => v.id == selectedVariantId);
            // console.log({variant});
            if (variant && variant.length) {
                if (variant[0].available) {
                    variantAvailableOnLoad = true;
                }
            }
        }
      
      
      let shouldUnselectSwatchOptions = !variantAvailableOnLoad;
      let optionsToUnselect = ['Color', 'Colour'];
      let colorIndex = 0;
      if(optionsToUnselect.includes(JSONData.options[0]) || optionsToUnselect.includes(JSONData.options[1])) {
      	shouldUnselectSwatchOptions = shouldUnselectSwatchOptions && true;
        if(optionsToUnselect.includes(JSONData.options[1])) {
        	colorIndex = 1;
        }
      } else {
	      shouldUnselectSwatchOptions = false;
      }
      
      console.log("option", JSONData.options, shouldUnselectSwatchOptions)

        // if variant doesn't exist in the URL, then only unselect swatches
        if (shouldUnselectSwatchOptions) {
//             unselectAllSwatchOptions(parent, 0);
//             unselectAllSwatchOptions(parent, 1);
          unselectAllSwatchOptions(parent, colorIndex);
          
          reselectOtherOptions();
          
            
            // Hide the qunatity box
            $('.product-quantity-box.purchase-details__quantity').hide();
            // disable the add to cart button
            $('.button--add-to-cart').attr('disabled', true);
            // change the text on the button
            $('.button--add-to-cart .text').text(Shopify.translation.unavailable);

            // remove the soldoout from all swatches
            $(`${parent} .swatch-element`).each(function (elem) {
                if (JSONData.options.length === 1) return;

                setTimeout(() => {
                    $(this).removeClass('soldout').find(':radio').removeAttr('disabled', 'disabled').removeAttr('checked');
                }, 0)

            })
        } else {
            // if current selected variant is available, show the selected values
            let variant_ = JSONData.variants.find(v => v.id == (selectedVariantId || window.hwg_selected_id));
			console.log("else....",selectedVariantId, window.hwg_selected_id, variant_)
            if (variant_ && variant_.available) {
                setTimeout(() => {
                           $(".option-unavailable").show();
		              $(".option-unavailable span").addClass('selected');
                    const optn1 = $(`div[data-value="${variant_.option1}"]`);
                    if (optn1 && optn1[0]) {
                        optn1[0].click();
                      	const span = $($(".option-unavailable")[0]).find('span');
                      	span.text(variant_.option1)
                  		$(".option-unavailable :eq(0) span").text(variant_.option1)
                  console.log(optn1)
//                   		$(optn1[0]).find('label').click();
//                   		updateOptionsInSelector(0, parent);
                    }

                    if(variant_.option2) {
                        const optn2 = $(`div[data-value="${variant_.option2}"]`);
                        if (optn2 && optn2[0]) {
                            optn2[0].click();
                          const span = $($(".option-unavailable")[1]).find('span');
                      	  span.text(variant_.option2)
//                            $(optn2[0]).find('label').click();
//                            updateOptionsInSelector(1, parent);
                        }
                    }

                }, 10)
            }
        }
        
        function reselectOtherOptions() {
          console.log('reselectOtherOptions:start');
        	const swatches = document.querySelectorAll('.swatch');
          for(let swatch of swatches) {
                      console.log(swatch);
          	const isColorOption = [...swatch.classList].includes('swatch-color');
            console.log({isColorOption, list: swatch.classList})
            if(!isColorOption) {
             	const checkedInput = swatch.querySelector('input:checked');
              if(checkedInput) {
              	checkedInput.checked = false;
//                 debugger;
//                 checkedInput.checked = true;
                const label = document.querySelector('#'+checkedInput.id);
                if(label) {
                  setTimeout(() => {
                  	label.click();           
				  }, 1000)
                }
                console.log('checked, unchecked', checkedInput);
                document.querySelector('.flickity-slider .product-gallery__thumbnail img').click()
              }
            }
          }
        }

    });

})()
