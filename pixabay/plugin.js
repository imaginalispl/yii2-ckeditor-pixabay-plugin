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
					title : 'Search for image in Pixabay',
					minWidth : 570,
					minHeight : 500,
					contents :
						[{
							id : 'pixabay',
							expand : true,
							elements : [
								{
									type: 'html',
									html: '<a href="https://pixabay.com/" target="_blank" style="display: block; max-width: 400px;margin: auto;"><img style="max-width: 400px" src="https://pixabay.com/static/img/public/leaderboard_a.png" alt="Pixabay"></a>'
								},
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
										ckeditorImagesQuery(query, 1, url);
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
									html : '<div class="pixabayImagesContainer"></div>',
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
												var selectedImageSrc = target.find('img').attr('data-full-src');
											else
												var selectedImageSrc = target.attr('data-full-src');

											var dialog = this._.dialog.getElement().$;
											var selectedImageSrcDiv = $(dialog).find('.selectedImageSrc');

											$(selectedImageSrcDiv).attr('data-src', selectedImageSrc);
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

												ckeditorImagesQuery(query, page, url);
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

												ckeditorImagesQuery(query, page, url);
											}
										},
									],
								},
							]
						}],
						onOk : function()
						{
							var urlForAjax = this.getParentEditor().config.pixabaySaveImageUrl;
							var dialog = this._.element.$;
							var selectedImageSrcDiv = $(dialog).find('.selectedImageSrc');
							var selectedImageSrc = $(selectedImageSrcDiv).attr('data-src');
							var savedImageSrc = '';

							$.ajax({
								url: urlForAjax,
								async: false,
								data: {src: selectedImageSrc},
								success: function(result)
								{
									result = $.parseJSON(result);
									savedImageSrc = result.imagePath;
								}
							});

							var element = CKEDITOR.dom.element.createFromHtml('<img src="'+savedImageSrc+'"/>');
							var instance = this.getParentEditor();
							instance.insertElement(element);
						}
				};
			});
		}
	});
})();

function ckeditorImagesQuery(query, page, url)
{
	$.ajax({
		url: url,
		data: {query: query, page: page, withoutView: true},
		success: function(result)
		{
			var result = $.parseJSON(result);
			var imageNumber = 0;
			var imagesPerRow = 5;
			var html = '';

			if(result.imagePatchs.length > 0)
			{
				html += '<style>';
				html += 'div.pixabayImagesContainer div.imageContainer img.imageToSelect {max-width: 100px; max-height: 100px}';
				html += 'div.pixabayImagesContainer div.selected.imageContainer {background-color: #69b10b;}';
				html += 'div.pixabayImagesContainer div.imageContainer {display:table-cell; vertical-align:middle; text-align:center; height:110px; width:110px; background-color: #f5f5f5}';
				html += 'div.imageContainerContainer {display: inline-block; margin: 0px 2px;}';
				html += '</style>';

				$(result.imagePatchs).each(function(element)
				{
					var src = result.imagePatchs[element].previewURL;
					var fullSrc = result.imagePatchs[element].webformatURL;

					if(imageNumber % imagesPerRow === 0)
						html += '<br/>';

					imageNumber++;

					html += '<div class="imageContainerContainer"><div class="imageContainer">';
					html += '<img class="imageToSelect" data-full-src="'+fullSrc+'" src="'+src+'"/>';
					html += '</div></div>';
				});
			}
			else
				html += 'Sorry, we couldn\'t find any matches.';

			$('.pixabayImagesContainer').html(html);

			var nextPageButton = $('td[role="presentation"] a[title="nextPageButton"]');
			if(result.pagination.nextPageAvailable === true)
			{
				var nextPageNumber = parseFloat(result.pagination.currentPage) + 1;

				nextPageButton.show();
				nextPageButton.attr('data-page', nextPageNumber);
			}
			else
				nextPageButton.hide();

			var previousPageButton = $('td[role="presentation"] a[title="previousPageButton"]');
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

