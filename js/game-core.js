/*
 loadLevel() - loads up the level
 fireRule() - fires the css rule
 updateProgressUI() - adds a checkmark to the level menu and header when a correct guess is made, removes it if incorrect
 hideTooltip() - hides markup tooltip that hovers over the elements
 showHelp() - Loads help text & examples for each level
 */

(function () {
    'use strict';

    var TABLE = '.table';

    var level;  // Holds current level info
    var levelCount = levels.length;
    var currentLevel = parseInt(localStorage.currentLevel, 10) || 0; // Keeps track of the current level Number (0 is level 1)
    var levelTimeout = 1500; // Delay between levels after completing
    var finished = false;    // Keeps track if the game is showing the Your Rock! screen (so that tooltips can be disabled)

    var blankProgress = {
        totalCorrect: 0,
        percentComplete: 0,
        lastPercentEvent: 0,
        guessHistory: {}
    };

    // Get progress from localStorage, or start from scratch if we don't have any
    var progress = JSON.parse(localStorage.getItem("progress")) || blankProgress;

    $(document).ready(function () {

        $(window).on("keydown", function (e) {
            if (e.keyCode == 27) {
                closeMenu();
            }
        });

        $(".main-content, .level-menu").mCustomScrollbar({
            scrollInertia: 0,
            autoHideScrollbar: true
        });

        $(".note-toggle").on("click", function () {
            $(this).hide();
            $(".note").slideToggle();
        });

        $(".level-menu-toggle-wrapper").on("click", function () {
            if ($(".menu-open").length == 0) {
                openMenu();
            } else {
                closeMenu();
            }
        });

        $(".level-nav").on("click", "a", function () {
            var $this = $(this);
            var direction;
            if ($this.hasClass("next")) {
                direction = "next";
            }

            addAnimation($this, "link-jiggle");

            if (direction == "next") {
                currentLevel++;
                if (currentLevel >= levelCount) {
                    currentLevel = levelCount - 1;
                }
            } else {
                currentLevel--;
                if (currentLevel < 0) {
                    currentLevel = 0;
                }
            }

            loadLevel();
            return false;
        });

        $(".reset-progress").on("click", function () {
            resetProgress();
            return false;
        });

        $(".editor").on("click", function () {
            $("input").focus();
        });

        $("input").on("keypress", function (e) {
            e.stopPropagation();
            if (e.keyCode == 13) {
                animateEnterHit();
                return false;
            }
        });

        $("input").on("keyup", function (e) {
            e.stopPropagation();
            var value = $(this).val();
            var length = value.length;
            if (length > 0) {
                showSelectorSpecificity(value);
                $("input").removeClass("input-strobe");
            } else {
                $("input").addClass("input-strobe");
            }
        });

        $(TABLE).on("mouseover", "*", function (e) {
            e.stopPropagation();
            showTooltip($(this));
        });

        $(TABLE).on("mouseout", "*", function (e) {
            hideTooltip();
            e.stopPropagation();
        });

        //Shows the tooltip on the table
        $(".markup").on("mouseover", "div *", function (e) {
            var el = $(this);
            var markupElements = $(".markup *");
            var index = markupElements.index(el) - 1;
            showTooltip($(".table *").eq(index));
            e.stopPropagation();
        });

        // Shows the tooltip on the table
        $(".markup").on("mouseout", "*", function (e) {
            e.stopPropagation();
            hideTooltip();
        });

        $(".enter-button").on("click", function () {
            animateEnterHit();
        });

        $(".table-wrapper,.table-edge").css("opacity", 0);

        buildLevelMenu();

        setTimeout(function () {
            loadLevel();
            $(".table-wrapper,.table-edge").css("opacity", 1);
        }, 50);
    });

    function addAnimation(el, className) {
        el.addClass("link-jiggle");
        el.one("animationend", function (e) {
            $(e.target).removeClass("link-jiggle");
        })
    }

    // Reset all progress
    // * Removes checkmarks from level header and list
    // * Scrolls level menu to top
    // * Resets the progress object

    function resetProgress() {
        currentLevel = 0;
        progress = blankProgress;
        localStorage.setItem("progress", JSON.stringify(progress));
        finished = false;

        $(".completed").removeClass("completed");
        loadLevel();
        closeMenu();
        $("#mCSB_2_container").css("top", 0); // Strange element to reset scroll due to scroll plugin
    }

    function checkLevelCompleted(levelNumber) {
        var levelHistory = progress.guessHistory[levelNumber];
        return Boolean(levelHistory && levelHistory.correct);
    }

    function buildLevelMenu() {
        for (var i = 0; i < levelCount; i++) {
            var level = levels[i];
            var item = document.createElement("a");
            $(item).html("<span class='checkmark'></span><span class='level-number'>" + (i + 1) + "</span>" + level.syntax);
            $(".level-menu .levels").append(item);

            if (checkLevelCompleted(i)) {
                $(item).addClass("completed");
            }

            $(item).on("click", function () {
                finished = false;
                currentLevel = $(this).index();
                loadLevel();
                closeMenu();
            });
        }
    }

    function closeMenu() {
        $(".side-menu").removeClass("menu-open");
    }

    function openMenu() {
        $(".side-menu").addClass("menu-open");
    }

    // Hides & shows the tooltip that appears when an eleemnt
    // on the table or the editor is hovered over.

    function hideTooltip() {
        $(".enhance").removeClass("enhance");
        $("[data-hovered]").removeAttr("data-hovered");
        $(".helper").hide();
    }

    function showTooltip(el) {
        if (finished) {
            return; // Only show tooltip if the game isn't finished yet
        }

        el.attr("data-hovered", true);
        var tableElements = $(".table *");
        var index = tableElements.index(el);
        $(".markup > div *").eq(index).addClass("enhance").find("*").addClass("enhance");

        var helper = $(".helper");
        var pos = el.offset();

        helper.css("top", pos.top - 65);
        helper.css("left", pos.left - 440);

        var helpertext;

        var elType = el.get(0).tagName;
        elType = elType.toLowerCase();
        helpertext = '<' + elType;

        var elClass = el.attr("class");

        if (elClass && elClass.indexOf("strobe") > -1) {
            elClass = elClass.replace("strobe", "");
        }

        if (elClass) {
            helpertext = helpertext + ' class="' + elClass + '"';
        }

        var elFor = el.attr("for");

        if (elFor) {
            helpertext = helpertext + ' for="' + elFor + '"';
        }

        var id = el.attr("id");
        if (id) {
            helpertext = helpertext + ' id="' + id + '"';
        }

        helpertext = helpertext + '></' + elType + '>';
        helper.show();
        helper.text(helpertext);
    }

    function animateEnterHit() {
        $(".enter-button").removeClass("enterhit");
        $(".enter-button").width($(".enter-button").width());
        $(".enter-button").addClass("enterhit");
        var value = $("input").val();
        handleInput(value);
    }

    function handleInput(text) {
        if (parseInt(text, 10) > 0 && parseInt(text, 10) < levelCount + 1) {
            currentLevel = parseInt(text, 10) - 1;
            loadLevel();
            return;
        }
        fireRule(text);
    }

    function showHelp() {

        var helpTitle = level.helpTitle || "";
        var help = level.help || "";
        var examples = level.examples || [];
        var selector = level.selector || "";
        var syntax = level.syntax || "";
        var syntaxExample = level.syntaxExample || "";
        var selectorName = level.selectorName || "";

        $(".display-help .syntax").html(syntax);
        $(".display-help .syntax-example").html(syntaxExample);
        $(".display-help .selector-name").html(selectorName);
        $(".display-help .title").html(helpTitle);
        $(".display-help .examples").html("");
        $(".display-help .examples-title").hide(); // Hide the "Examples" heading

        for (var i = 0; i < examples.length; i++) {
            var example = $("<div class='example'>" + examples[i] + "</div>");
            $(".display-help .examples").append(example);
            $(".display-help .examples-title").show(); // Show it if there are examples
        }

        $(".display-help .hint").html(help);
        $(".display-help .selector").text(selector);
    }

    function resetTable() {
        $(".display-help").removeClass("open-help");
        $(".clean,.strobe").removeClass("clean,strobe");
        $(".clean,.strobe").removeClass("clean,strobe");
        $("input").addClass("input-strobe");
        $(".table *").each(function () {
            $(this).width($(this).width());
        });

        var tableWidth = $(TABLE).outerWidth();
        $(".table-wrapper, .table-edge").width(tableWidth);
    }

    function fireRule(rule) {
        if (rule === ".strobe") {
            rule = null;
        }

        $(".shake").removeClass("shake");

        $(".strobe,.clean,.shake").each(function () {
            $(this).width($(this).width());
            $(this).removeAttr("style");
        });

        /*
         * Sean Nessworthy <sean@nessworthy.me>
         * On 03/17/14
         *
         * Allow [div][.table] to preceed the answer.
         * Makes sense if div.table is going to be included in the HTML viewer
         * and users want to try and use it in their selectors.
         *
         * However, if it is included as a specific match, filter it out.
         * This resolves the  "Match all the things!" level from beheading the table too.
         * Relatedly, watching that happen made me nearly spill my drink.
         */

        // var baseTable = $('.table-wrapper > .table, .table-wrapper > .nametags, .table-wrapper > .table-surface');
        var baseTable = $(TABLE);

        // Check if jQuery will throw an error trying the mystery rule
        // If it errors out, change the rule to null so the wrong-guess animation will work
        try {
            $(TABLE).find(rule).not(baseTable);
        }
        catch (err) {
            rule = null;
        }

        var ruleSelected = $(TABLE).find(rule).not(baseTable);            // What the correct rule finds
        var levelSelected = $(TABLE).find(level.selector).not(baseTable); // What the person finds

        var win = false;

        // If nothing is selected
        if (ruleSelected.length == 0) {
            $(".editor").addClass("shake");
        }

        if (ruleSelected.length == levelSelected.length && ruleSelected.length > 0) {
            win = checkResults(ruleSelected, levelSelected, rule);
        }

        if (win) {
            trackProgress(currentLevel - 1, "correct");
            ruleSelected.removeClass("strobe");
            ruleSelected.addClass("clean");
            $("input").val("");
            $(".input-wrapper").css("opacity", .2);
            updateProgressUI(currentLevel, true);
            currentLevel++;

            if (currentLevel >= levelCount) {
                winGame();
            } else {
                setTimeout(function () {
                    loadLevel();
                }, levelTimeout);
            }
        } else {
            trackProgress(currentLevel, "incorrect");
            ruleSelected.removeClass("strobe");
            ruleSelected.addClass("shake");

            setTimeout(function () {
                $(".shake").removeClass("shake");
                $(".strobe").removeClass("strobe");
                levelSelected.addClass("strobe");
            }, 500);

            $(".result").fadeOut();
        }
    }

    // Marks an individual number as completed or incompleted
    // Just in the level heading though, not the level list
    function updateProgressUI(levelNumber, completed) {
        if (completed) {
            $(".levels a:nth-child(" + (levelNumber + 1) + ")").addClass("completed");
            $(".level-header").addClass("completed");
        } else {
            $(".level-header").removeClass("completed");
        }
    }

    function trackProgress(levelNumber, type) {
        if (!progress.guessHistory[levelNumber]) {
            progress.guessHistory[levelNumber] = {
                correct: false,
                incorrectCount: 0,
                gaSent: false
            };
        }

        var levelStats = progress.guessHistory[levelNumber];

        if (type == "incorrect") {
            if (levelStats.correct == false) {
                levelStats.incorrectCount++; // Only update the incorrect count until it is guessed correctly
            }
        } else {
            if (levelStats.correct == false) {
                levelStats.correct = true;
                progress.totalCorrect++;
                progress.percentComplete = progress.totalCorrect / levelCount;
                levelStats.gaSent = true;
            }
        }

        // Increments the completion percentage by 10%, and sends an event every time
        var increment = .1;
        if (progress.percentComplete >= progress.lastPercentEvent + increment) {
            progress.lastPercentEvent = progress.lastPercentEvent + increment;
        }

        localStorage.setItem("progress", JSON.stringify(progress));
    }

    function winGame() {
        $(TABLE).html('<span class="winner"><strong>You did it!</strong><br>You rock at CSS.</span>');
        addNametags();
        finished = true;
        resetTable();
    }

    function checkResults(ruleSelected, levelSelected, rule) {
        var ruleTable = $(TABLE).clone();
        ruleTable.find(".strobe").removeClass("strobe");
        ruleTable.find(rule).addClass("strobe");
        return ($(TABLE).html() == ruleTable.html());
    }

    function getMarkup(el) {
        var hasChildren = Boolean(el.children.length > 0);
        var elName = el.tagName.toLowerCase();
        var wrapperEl = $("<div/>");
        var attributeString = "";

        $.each(el.attributes, function () {
            if (this.specified) {
                attributeString = attributeString + ' ' + this.name + '="' + this.value + '"';
            }
        });

        var attributeSpace = "";
        if (attributeString.length > 0) {
            attributeSpace = " ";
        }
        if (hasChildren) {
            wrapperEl.text("<" + elName + attributeSpace + attributeString + ">");
            $(el.children).each(function (i, el) {
                wrapperEl.append(getMarkup(el));
            });
            wrapperEl.append("&lt;" + elName + "/&gt;");
        } else {
            wrapperEl.text("<" + elName + attributeSpace + attributeString + "/>");
        }
        return wrapperEl;
    }

    function loadBoard() {
        var markupHolder = $("<div/>");

        showHelp();
        $(level.boardMarkup).each(function (i, el) {
            if (el.nodeType == 1) {
                var result = getMarkup(el);
                markupHolder.append(result);
            }
        });
        $(TABLE).html(level.boardMarkup);
        addNametags();
        $(".table *").addClass("pop");

        $(".markup").html('<div>&ltdiv class="table"&gt' + markupHolder.html() + '&lt/div&gt</div>');
    }

    function addNametags() {
        $(".nametags *").remove();
        $(".table-wrapper").css("transform", "rotateX(0)");
        $(".table-wrapper").width($(".table-wrapper").width());

        $(".table *").each(function () {
            if ($(this).attr("for")) {
                var pos = $(this).position();
                var width = $(this).width();
                var nameTag = $("<div class='nametag'>" + $(this).attr("for") + "</div>");
                $(".nametags").append(nameTag);
                var tagPos = pos.left + (width / 2) - nameTag.width() / 2 + 12;
                nameTag.css("left", tagPos);
            }
        });

        $(".table-wrapper").css("transform", "rotateX(20deg)");
    }

    function loadLevel() {
        if (currentLevel < 0 || currentLevel >= levelCount) {
            currentLevel = 0;
        }

        hideTooltip();

        level = levels[currentLevel];

        if (currentLevel < 5) {
            $(".note-toggle").show();
        } else {
            $(".note-toggle").hide();
        }

        $(".level-menu .current").removeClass("current");
        $(".level-menu div a").eq(currentLevel).addClass("current");

        var percent = (currentLevel + 1) / levelCount * 100;
        $(".progress").css("width", percent + "%");

        localStorage.setItem("currentLevel", currentLevel);

        loadBoard();
        resetTable();
        resetSelectorSpecificity();

        $(".level-header .level-text").html("Level " + (currentLevel + 1) + " of " + levelCount);

        updateProgressUI(currentLevel, checkLevelCompleted(currentLevel));

        $(".order").text(level.doThis);
        $("input").val("").focus();

        $(".input-wrapper").css("opacity", 1);
        $(".result").text("");

        setTimeout(function () {
            $(".table " + level.selector).addClass("strobe");
            $(".pop").removeClass("pop");
        }, 200);
    }

    function showSelectorSpecificity(value) {
        var $selector = $(".selector-container");
        var result = SPECIFICITY.calculate(value);
        var html = "";
        for (var selector in result) {
            html += "Selector: '" + result[selector].selector.trim() + "', value: " + result[selector].specificity + "<br/>";

        }
        $selector.html(html);
    }

    function resetSelectorSpecificity() {
        $(".selector-container").html("");
    }

}());