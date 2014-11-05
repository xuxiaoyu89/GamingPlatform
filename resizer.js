  //==========HANDLES DIV RESIZING==================//
    // Cache the div so that the browser doesn't have to find it every time the window is resized.
    var $div1 = $('div.SMPG_game_goback');
    var $div2 = $('.SMPG_game_goback');
    // Run the following when the window is resized, and also trigger it once to begin with.
    $(window).resize(function () {
      // Get the current height of the div and save it as a variable.
      var height1 = $div1.height();
      var height2 = $div2.height();
      $log.info("HEIGHT 1: ", height1);
      $log.info("HEIGHT 2: ", height2);
      // Set the font-size and line-height of the text within the div according to the current height.
      //$div.css({
      //'font-size': (height/2) + 'px',
      //'line-height': height + 'px'
      //})
    }).trigger('resize');​
  //==========HANDLES DIV RESIZING==================//
