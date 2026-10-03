const fs = require('fs');
let code = fs.readFileSync('static/js/display.js', 'utf8');

code = code.replace(
    'const blank = revealed',
    'const isWrong = currentBlank.wrong === true;\n        const colorClass = isWrong ? \'inline-blank-wrong\' : \'inline-blank-revealed\';\n        const blank = revealed'
);

code = code.replace(
    '<span class="inline-blank inline-blank-revealed">?  ?</span>',
    '<span class="inline-blank ">?  ?</span>'
);

// Also need to handle complete mode and guess mode which sets blankBox class:
// blankBox.classList.add('revealed');
// we should also handle wrong for those.
// Wait, for complete/guess mode, TRIGGER_WRONG doesn't do a reveal?
// The user said: "only one attempt per blank! and show the correct answer instead and style it red".
// But complete and guess only have one attempt total for the whole song anyway! 
// Let's modify TRIGGER_WRONG in controller.js first!

fs.writeFileSync('static/js/display.js', code);
