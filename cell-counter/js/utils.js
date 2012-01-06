function getCSSRule(ruleName, deleteFlag) {               // Return requested style obejct
    ruleName=ruleName.toLowerCase();                       // Convert test string to lower case.
    if (document.styleSheets) {                            // If browser can play with stylesheets
        for (var i=0; i<document.styleSheets.length; i++) { // For each stylesheet
            var styleSheet=document.styleSheets[i];          // Get the current Stylesheet
            var ii=0;                                        // Initialize subCounter.
            var cssRule=false;                               // Initialize cssRule.
            do {                                             // For each rule in stylesheet
                if (styleSheet.cssRules) {                    // Browser uses cssRules?
                    cssRule = styleSheet.cssRules[ii];         // Yes --Mozilla Style
                } else {                                      // Browser usses rules?
                    cssRule = styleSheet.rules[ii];            // Yes IE style.
                }                                             // End IE check.
                if (cssRule)  {                               // If we found a rule...
                    if (cssRule.selectorText.toLowerCase()==ruleName) { //  match ruleName?
                        if (deleteFlag=='delete') {             // Yes.  Are we deleteing?
                            if (styleSheet.cssRules) {           // Yes, deleting...
                                styleSheet.deleteRule(ii);        // Delete rule, Moz Style
                            } else {                             // Still deleting.
                                styleSheet.removeRule(ii);        // Delete rule IE style.
                            }                                    // End IE check.
                            return true;                         // return true, class deleted.
                        } else {                                // found and not deleting.
                            return cssRule;                      // return the style object.
                        }                                       // End delete Check
                    }                                          // End found rule name
                }                                             // end found cssRule
                ii++;                                         // Increment sub-counter
            } while (cssRule)                                // end While loop
        }                                                   // end For loop
    }                                                      // end styleSheet ability check
    return false;                                          // we found NOTHING!
}                                                         // end getCSSRule
