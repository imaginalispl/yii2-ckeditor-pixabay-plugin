/*
 * @author Imaginalis Software TM
 * @link http://imaginalis.pl
 */
( function()
{
	CKEDITOR.plugins.add('pixabay',
	{
		icons: 'icon',
		init: function(editor)
		{
			CKEDITOR.config.dialog_noConfirmCancel = true;
			editor.addCommand('pixabay', new CKEDITOR.dialogCommand('pixabay'));

			editor.ui.addButton('pixabay',
			{
				label : 'Select image',
				toolbar : 'insert',
				command : 'pixabay',
				icon : this.path + 'images/icon.png',
			});

			CKEDITOR.dialog.add('pixabay', function()
			{
				return {
					title : 'Search for image',
					minWidth : 580,
					minHeight : 510,
					contents :
						[{
							id : 'pixabay',
							expand : true,
							elements : [
								{
									id : 'txtEmbed',
									type : 'text',
									label : 'Write query to search',
									autofocus : 'autofocus',
									title: 'queryInput',
									onKeyUp : function ()
									{
										var	query = this.getValue();
										var url = this._.dialog.getParentEditor().config.pixabaySearchImagesUrl;
										$(this._.dialog.getElement().$).find('.selectedImageSrc').attr('data-query', query);
										ckeditorImagesQuery(query, 1, url, CKEDITOR.currentInstance.name);
									},
									validate : function ()
									{
										var dialog = this._.dialog.getElement().$;
										var selectedImageSrcDiv = $(dialog).find('.selectedImageSrc');
										var selectedImageSrc = $(selectedImageSrcDiv).attr('data-src');

										if(selectedImageSrc === '')
										{
											alert('Select image');
											return false;
										}

										return true;
									},
								},
								{
									type: 'html',
									html: '<div class="selectedImageSrc" data-src="" data-query="" style="display: none"></div>',
								},
								{
									id : 'pixabayImagesContainer',
									type : 'html',
									html : '<div class="pixabayImagesContainer"></div><div class="pixabayOverlay"><span style="display: none; position: absolute; top: 25%; left: 34%;"><img src="'+CKEDITOR.plugins.get('pixabay').path+'images/ajaxLoader.svg"</span></div>',
									onClick : function(api)
									{
										var target = $(api.data.getTarget().$);

										if(target.hasClass('imageContainer') || target.hasClass('imageToSelect'))
										{
											$('div.pixabayImagesContainer div.imageContainer.selected').removeClass('selected');

											if(target.hasClass('imageContainer'))
												target.addClass('selected');
											else
												target.parent().addClass('selected');

											if(target.hasClass('imageContainer'))
											{
												var selectedImageSrc = target.find('img').attr('data-full-src');
												var externalId = target.find('img').attr('external-id');
												var sourceType = target.find('img').attr('source-type');
											}
											else
											{
												var selectedImageSrc = target.attr('data-full-src');
												var externalId = target.attr('external-id');
												var sourceType = target.attr('source-type');
											}

											var dialog = this._.dialog.getElement().$;
											var selectedImageSrcDiv = $(dialog).find('.selectedImageSrc');

											$(selectedImageSrcDiv).attr('data-src', selectedImageSrc);
											$(selectedImageSrcDiv).attr('external-id', externalId);
											$(selectedImageSrcDiv).attr('source-type', sourceType);
										}
									}
								},
								{
									type : 'hbox',
									widths : [ '70%', '15%', '15%' ],
									children :
									[
										{
											type: 'button',
											id: 'previousPageButton',
											title: 'previousPageButton',
											label: '< Previous page',
											style: 'display: none',
											onClick: function()
											{
												var page = $('#'+this.domId).attr('data-page');
												var query = $(this._.dialog.getElement().$).find('.selectedImageSrc').attr('data-query');
												var url = this._.dialog.getParentEditor().config.pixabaySearchImagesUrl;

												ckeditorImagesQuery(query, page, url, CKEDITOR.currentInstance.name, true);
											}
										},
										{
											type: 'button',
											id: 'nextPageButton',
											title: 'nextPageButton',
											label: 'Next page >',
											style: 'display: none',
											onClick: function()
											{
												var page = $('#'+this.domId).attr('data-page');
												var query = $(this._.dialog.getElement().$).find('.selectedImageSrc').attr('data-query');
												var url = this._.dialog.getParentEditor().config.pixabaySearchImagesUrl;

												ckeditorImagesQuery(query, page, url, CKEDITOR.currentInstance.name, true);
											}
										},
									],
								},
							]
						}],
						onOk : function()
						{
							var ckeditorDialog = $('.cke_editor_'+CKEDITOR.currentInstance.name+'_dialog');
							var urlForAjax = this.getParentEditor().config.pixabaySaveImageUrl;
							var selectedImageSrcDiv = ckeditorDialog.find('.selectedImageSrc');

							var selectedImageSrc = $(selectedImageSrcDiv).attr('data-src');
							var externalId = $(selectedImageSrcDiv).attr('external-id');
							var sourceType = $(selectedImageSrcDiv).attr('source-type');
							var savedImageSrc = '';
							var instance = this.getParentEditor();

							$.ajax({
								url: urlForAjax,
								data: {src: selectedImageSrc},
								success: function(result)
								{
									result = $.parseJSON(result);
									savedImageSrc = result.imagePath;

									var element = CKEDITOR.dom.element.createFromHtml('<img class="imageAdded" title="'+sourceType+'-'+externalId+'" src="'+savedImageSrc+'"/>');
									instance.insertElement(element);
								}
							});
						}
				};
			});
		}
	});
})();

var previousPage = [];
var previousQuery = [];
var timer = 0;
function ckeditorImagesQuery(query, page, url, ckeditorName, immediately)
{
	immediately = typeof immediately !== 'undefined' ? immediately : false;

	if(immediately)
	{
		ajaxQuery(query, page, url, ckeditorName);
	}
	else
	{
		clearTimeout(timer);
		timer = setTimeout(function()
		{
			ajaxQuery(query, page, url, ckeditorName);
		}, 500);
	}
}

function ajaxQuery(query, page, url, ckeditorName)
{
	if(query != '' && (query != previousQuery[ckeditorName] || page != previousPage[ckeditorName]))
	{
		ckeditorDialog = $('.cke_editor_'+ckeditorName+'_dialog');

		$.ajax({
			url: url,
			data: {query: query, page: page, withoutView: true},
			beforeSend: function()
			{
				ckeditorDialog.find('div.pixabayOverlay').fadeIn();
				ckeditorDialog.find('div.pixabayOverlay span').fadeIn();
				ckeditorDialog.find('.pixabayImagesContainer').parent().css('position', 'relative');
			},
			success: function(result)
			{
				previousPage[ckeditorName] = page;
				previousQuery[ckeditorName] = query;
				var result = $.parseJSON(result);
				var imageNumber = 0;
				var imagesPerRow = 5;
				var html = '';

				if(result.imagePatchs.length > 0)
				{
					html += '<style>';
					html += ckeditorDialog.selector + ' div.pixabayOverlay span { position: absolute; top: 25%; left: 34%;}';
					html += ckeditorDialog.selector + ' div.pixabayOverlay {top: 1%; position:absolute; width:100%; height:106%; background-color:rgba(255,255,255,0.8); text-align:center; z-index:999; display:block;}';
					html += ckeditorDialog.selector + ' div.pixabayImagesContainer div.imageContainer img.imageToSelect {max-width: 100px; max-height: 100px}';
					html += ckeditorDialog.selector + ' div.pixabayImagesContainer div.selected.imageContainer {background-color: #69b10b;}';
					html += ckeditorDialog.selector + ' div.pixabayImagesContainer div.imageContainer {display:table-cell; vertical-align:middle; text-align:center; height:110px; width:110px; background-color: #f5f5f5}';
					html += ckeditorDialog.selector + ' div.imageContainerContainer {display: inline-block; margin: 0px 2px;}';
					html += '</style>';

					$(result.imagePatchs).each(function(element)
					{
						var src = result.imagePatchs[element].previewURL;
						var fullSrc = result.imagePatchs[element].webformatURL;
						var externalId = result.imagePatchs[element].externalId;
						var sourceType = result.imagePatchs[element].sourceType;

						if(imageNumber % imagesPerRow === 0)
							html += '<br/>';

						imageNumber++;

						html += '<div class="imageContainerContainer"><div class="imageContainer">';
						html += '<img class="imageToSelect" external-id="'+externalId+'" source-type="'+sourceType+'" data-full-src="'+fullSrc+'" src="'+src+'"/>';
						html += '</div></div>';
					});
				}
				else
					html += 'Sorry, we couldn\'t find any matches.';

				ckeditorDialog.find('.pixabayImagesContainer').html(html);
				ckeditorDialog.find('div.pixabayOverlay').fadeOut();
				ckeditorDialog.find('div.pixabayOverlay span').fadeOut();

				var nextPageButton = ckeditorDialog.find('td[role="presentation"] a[title="nextPageButton"]');
				if(result.pagination.nextPageAvailable === true)
				{
					var nextPageNumber = parseFloat(result.pagination.currentPage) + 1;

					nextPageButton.show();
					nextPageButton.attr('data-page', nextPageNumber);
				}
				else
					nextPageButton.hide();

				var previousPageButton = ckeditorDialog.find('td[role="presentation"] a[title="previousPageButton"]');
				if(result.pagination.previousPageAvailable === true)
				{
					var previousPageNumber = parseFloat(result.pagination.currentPage) - 1;

					previousPageButton.show();
					previousPageButton.attr('data-page', previousPageNumber);
				}
				else
					previousPageButton.hide();
			}
		});
	}
}
