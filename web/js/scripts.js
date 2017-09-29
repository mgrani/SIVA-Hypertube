$(document).ready(function(){
	setLayout();
});
$(window).resize(function(){
	setLayout();
});

function setLayout(){
    resizeProjectTitle();
}

function resizeProjectTitle() {
    var navigationLeftWidth = 0;
    $('.navigationLeft').each(function() {
        navigationLeftWidth += $(this).outerWidth(true);
    });
    var navigationRightWidth = 0;
    $('.navigationRight').each(function() {
        navigationRightWidth += $(this).outerWidth(true);
    });
    var maxHeaderTitleWidth = $('#navigation').outerWidth() - 2 * Math.max(navigationLeftWidth, navigationRightWidth);
    $('#headerTitle').css({"width": maxHeaderTitleWidth + "px", "left": "calc(50% - " + maxHeaderTitleWidth/2 + "px"});
}