'use strict';

(function () {

    const capitalize = foo => {
        return foo && foo.charAt(0).toUpperCase() + foo.substr(1);
    };

    const verboseNumber = number => {
        switch (Number(number)) {
            case 1:
                return 'one';
            case 2:
                return 'two';
            case 3:
                return 'three';
            case 4:
                return 'four';
            case 5:
                return 'five';
            case 6:
                return 'six';
            case 7:
                return 'seven';
            case 8:
                return 'eight';
            case 9:
                return 'nine';
            case 10:
                return 'ten';
        }
        return number;
    };
    const plural = (singular, plural, number) => {
        return Number(number) === 1 ? singular : plural;
    };

    const pickOne = (texts, maybeNotThatOne) => {
        if (texts.length === 1) {
            return texts[0];
        }
        const randomIndex = Math.floor(Math.random() * texts.length);
        if (maybeNotThatOne && maybeNotThatOne === randomIndex) {
            return texts[randomIndex === 0 ? 1 : randomIndex - 1];
        }
        return texts[randomIndex];
    };

    class Hangman {
        constructor() {
        }

        init(word) {
            this.state = 'open';
            this.word = word;
            this.lettersStillToFind = this.word.letters().split('').reduce((agg, letter) => {
                if (agg.indexOf(letter) === -1) {
                    agg.push(letter);
                }
                return agg;
            }, []);
            this.suggestedLetters = [];
            this.suggestions = 0;
            this.lastSuggestionWorked = undefined;
            this.lastSuggestion = undefined;
            this.streak = [];
            this.fails = 0;
            this.maxFails = 10;
        }

        wordForUser() {
            return this.word.letters()
                .split('')
                .map(letter => this.state === 'open' && this.lettersStillToFind.indexOf(letter) > -1 ? undefined : letter.toUpperCase());
        }

        getState() {
            return this.state;
        }

        attempts() {
            return [this.fails, this.maxFails];
        }

        suggest(letter) {

            this.inputStatus = undefined;

            if (this.state !== 'open') {
                this.inputStatus = 'not-open';
                return false;
            }

            letter = letter && letter.toLowerCase();
            if (!letter || letter.length > 1) {
                this.inputStatus = 'invalid-letter';
                return false;
            }

            this.lastSuggestion = letter;

            if (this.suggestedLetters.indexOf(letter) > -1) {
                this.inputStatus = 'already-suggested';
                return false;
            }

            this.suggestions++;

            const foundLetterIndex = this.lettersStillToFind.indexOf(letter);
            this.suggestedLetters.push(letter);
            if (foundLetterIndex > -1) {
                this.lettersStillToFind.splice(foundLetterIndex, 1);

                if (this.lastSuggestionWorked)
                    this.streak.push(letter);
                else
                    this.streak = [letter];

                this.lastSuggestionWorked = true;
                if (this.lettersStillToFind.length === 0) {
                    this.state = 'won';
                }
                return true;
            }

            this.fails++;

            if (!this.lastSuggestionWorked)
                this.streak.push(letter);
            else
                this.streak = [letter];

            this.lastSuggestionWorked = false;

            if (this.fails >= this.maxFails) {
                this.state = 'lost';
            }

            return false;
        }

    }

    class HangManUI {
        constructor(selector, game, wordFetcher) {
            this.game = game;
            this.wordFetcher = wordFetcher;
            this.element = document.querySelector(selector);
            this.buttonMap = new Map();
            this.letterDivs = [];
            this.initElements();
        }

        initElements() {
            this.panelsDiv = this.element.appendChild(document.createElement('div'));
            this.panelsDiv.classList.add('hangman-panels');

            let header = this.panelsDiv.appendChild(document.createElement('div'));
            header.classList.add('hangman-header', 'hangman-panel');

            this.centerDiv = this.panelsDiv.appendChild(document.createElement('div'));
            this.centerDiv.classList.add('hangman-center');

            this.redDiv = this.centerDiv.appendChild(document.createElement('div'));
            this.redDiv.classList.add('hangman-red');

            this.titleDiv = header.appendChild(document.createElement('div'));
            this.titleDiv.classList.add('hangman-title');
            this.titleDiv.innerText = 'Hangman 2.0';

            this.initGameButton = header.appendChild(document.createElement('div'));
            this.initGameButton.classList.add('hangman-init-game', 'button');
            this.initGameButton.innerText = 'New Game [SPACE]';

            this.wordDiv = this.centerDiv.appendChild(document.createElement('div'));
            this.wordDiv.classList.add('hangman-word');

            this.commentDiv = this.centerDiv.appendChild(document.createElement('div'));
            this.commentDiv.classList.add('hangman-comment');

            this.hint1Div = this.centerDiv.appendChild(document.createElement('div'));
            this.hint1Div.classList.add('hangman-hint', 'hangman-hint-1');
            this.hint1Div.style.opacity = 0;
            this.hint2Div = this.centerDiv.appendChild(document.createElement('div'));
            this.hint2Div.classList.add('hangman-hint', 'hangman-hint-2');
            this.hint2Div.style.opacity = 0;

            const keyboardDiv = this.panelsDiv.appendChild(document.createElement('div'));
            keyboardDiv.classList.add('hangman-keyboard', 'hangman-panel');
            [['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm'],
                ['n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']].forEach(row => {
                const keyboardRowDiv = keyboardDiv.appendChild(document.createElement('div'));
                keyboardRowDiv.classList.add('hangman-keyboard-row', 'buttons');
                row.forEach(letter => {
                    const letterDiv = keyboardRowDiv.appendChild(document.createElement('div'));
                    letterDiv.classList.add('key', 'button');
                    letterDiv.innerText = letter.toUpperCase();
                    this.buttonMap.set(letter, letterDiv.classList);
                });
            });

            this.element.addEventListener('click', event => {
                if (event.target.classList.contains('key')) {
                    const letter = event.target.innerText;
                    if (letter.length === 1) {
                        this.suggest(letter);

                    }
                }
                if (event.target === this.initGameButton) {
                    this.start();
                }
            });

            window.addEventListener('keypress', () => {
                const letter = String.fromCharCode(window.event.charCode).toUpperCase();
                if (letter >= 'a' && letter <= 'z' || letter >= 'A' && letter <= 'Z') {
                    this.suggest(letter);
                }
                else if (letter === ' ')
                    this.start();
                else {
                    return;
                }
                window.event.preventDefault();

            }, false);
        }

        start() {
            this.wordFetcher.fetch(word => {
                this.game.init(word);
                this.letterDivs = [];
                while (this.wordDiv.hasChildNodes()) {
                    this.wordDiv.removeChild(this.wordDiv.lastChild);
                }
                this.game.word.letters().split('').forEach(letter => {
                    const letterDiv = this.wordDiv.appendChild(document.createElement('div'));
                    letterDiv.classList.add('hangman-letter', 'unresolved');
                    letterDiv.innerText = '_';
                    this.letterDivs.push(letterDiv);
                });

                this.update();
            });
        }

        suggest(letter) {
            this.game.suggest(letter.toLowerCase());
            this.update();
        }

        update() {
            const escapedLetters = this.game.wordForUser().map(letter => !letter ? '_' : letter);
            const escapedWord = escapedLetters.join('');
            this.hint1Div.innerText = this.game.word.hint1();
            this.hint2Div.innerText = this.game.word.hint2().toLowerCase().replace(this.game.word.letters(), escapedWord.toLowerCase());

            const [fails, max] = this.game.attempts();

            const state = this.game.getState();
            if (state === 'open') {
                this.hint1Div.innerText = 'Hint: ' + this.hint1Div.innerText;
                this.hint2Div.innerText = 'Hint: ' + this.hint2Div.innerText;
            }

            this.commentDiv.innerText = pickOne(this.buildComment(state, fails, max), this.commentDiv.innerText);

            const problematic = fails / max > 0.1;
            this.hint1Div.style.opacity = state !== 'open' || problematic ? 0.8 : 0;

            const catastrophic = fails / max > 0.6;
            this.hint2Div.style.opacity = state !== 'open' || catastrophic ? 0.8 : 0;

            const animationDuration = 1100 - (fails * 100);

            const animator = (div, enable = true) => {
                if (enable && catastrophic && state === 'open') {
                    div.style.animationName = Math.random() > 0.5 ? 'swing661' : 'swing660';
                    div.style.animationDuration = `${animationDuration}ms`;
                    div.style.animationIterationCount = 'infinite';
                }
                else if (enable && problematic && state === 'open') {
                    div.style.animationName = Math.random() > 0.5 ? 'swing331' : 'swing330';
                    div.style.animationDuration = `${animationDuration}ms`;
                    div.style.animationIterationCount = 'infinite';
                }
                else {
                    div.style.animationName = undefined;
                    div.style.animationDuration = undefined;
                    div.style.animationIterationCount = undefined;
                }
            };

            this.redDiv.style.transform = `scaleX(${state === 'won' ? 0 : (fails / max)})`;
            this.redDiv.style.opacity = `${0.1 + (fails / max) * 0.3}`;

            this.letterDivs.forEach((letterDiv, index) => {
                letterDiv.innerText = escapedLetters[index];
                animator(letterDiv, letterDiv.innerText === '_')
            });

            this.buttonMap.forEach((classList, letter) => {
                classList.toggle('disabled', state !== 'open' || this.game.suggestedLetters.indexOf(letter) > -1);
            });
        }

        buildComment(state, fails, max) {
            const suggestions = this.game.suggestions;
            const lastSuggestionWorked = this.game.lastSuggestionWorked;
            const lastSuggestion = this.game.lastSuggestion && this.game.lastSuggestion.toUpperCase();
            const streakLength = this.game.streak.length;
            const streak = this.game.streak.map(letter => letter.toUpperCase());

            if (state === 'lost') {
                return [`You have lost!`, `Sorry, no luck this time.`, `Lost you have.`, `There is no cake. Seriously.`];
            }

            if (state === 'won' && fails === 0) {
                return [`Victory! What a flawless effort on your part!`,
                    `We stand amazed - zero fails.`,
                    `Won you have, mistakes avoid you could.`,
                    `You have won. There will be cake next time.`,
                    `You have won. Sadly, the cake is a lie.`];
            }

            if (state === 'won') {
                return [`You have won. It only took you ${verboseNumber(fails)} wrong ${plural('guess', 'guesses', fails)}.`,
                    `Not bad, not bad at all.`,
                    `Unfortunately there is no cake is left - but on the other hand you won.`];
            }

            const inputStatus = this.game.inputStatus;
            if (inputStatus === 'not-open') {
                return [`The game is not open.`];
            }
            if (inputStatus === 'invalid') {
                return [`The letter is not recognized.`];
            }
            if (inputStatus === 'already-suggested') {
                if (this.game.word.contains(this.game.lastSuggestion)) {
                    return [`"${lastSuggestion}"? We already celebrated that one!`];
                }
                else {
                    return [`You already tried "${lastSuggestion}", have you already forgotten?`,
                        `"${lastSuggestion}" - don't you remember that we already crossed that off our list?`];
                }
            }

            if (suggestions === 0) {
                return [
                    `Choose a letter you must ... now.`,
                    `Off we go ... guess wisely!`,
                    `It's a new game - what could go wrong?`,
                    `Please begin. NOTE: Fail counter starts at zero and stops at ${max}.`,
                    `One letter at a time. HINT: There will be cake for the winners.`
                ];
            }

            if (fails === 0 && streakLength > 2) {
                return [`Wonderful - ${verboseNumber(streakLength)} guesses already and nothing wrong so far!`];
            }

            if (fails === 0 && streakLength === 1) {
                return [`Starting with a correct guess is certainly a good omen.`,
                    `"${lastSuggestion}" was correct - what a magnificent start!`];
            }

            if (fails === 0) {
                return [`Marvellous - this is a flawless display of guess-mastery.`,
                    `The force is strong with this one!`];
            }

            if (lastSuggestionWorked && streakLength > 1) {
                return [`${capitalize(verboseNumber(streakLength))} correct in a row ... not bad!`,
                    `You're having a nice run - keep on going and just steer clear of wrong guesses!`];
            }
            if (lastSuggestionWorked && streakLength > 2) {
                return [`Awesome - you're unstoppable!`,
                    `"${lastSuggestion}" is also correct - are you cheating?`];
            }

            if (!lastSuggestionWorked && streakLength > 3) {
                const no = ['nope', 'nada', 'negative', 'hell no', 'zilch', 'come on'];
                return [`Sorry, but you're terrible at guessing letters. Are you sure this game is for you?`,
                    `Keep this up, and you shall certainly lose.`,
                    `${streak.map((letter, index) => `"${letter}"? ${no[Math.floor(Math.random() * no.length)]}.`).join(' ')} And you still want to win?`];
            }

            if (!lastSuggestionWorked && streakLength > 2) {
                return [`You're having a bad streak ... ${verboseNumber(streakLength)} wrong in a row.`,
                    `You're still in the game, but you better start not getting everything wrong.`,
                    `${streak.map(letter => `"${letter}"? wrong.`).join(' ')} Are you sure you know how this works?`];
            }

            if (!lastSuggestionWorked && streakLength > 1) {
                return [`${capitalize(verboseNumber(streakLength))} wrong in a row ... this is starting to go downhill!`,
                    `${capitalize(verboseNumber(streakLength))} wrong in a row. This is heading nowhere fast!`];
            }

            if (!lastSuggestionWorked && streakLength === 1) {
                return [`I'm sorry to inform you that "${lastSuggestion}" is a fail.`,
                    `"${lastSuggestion}" is certainly a fine letter, yet still a fail in my book.`,
                    `There are many fine words that contain a "${lastSuggestion}", but unfortunately the one we're looking is not among them.`,
                    `"${lastSuggestion}" ... surely you're joking, Mr. Feynman?`];
            }

            if (fails > 0 && lastSuggestionWorked) {
                return [`"${lastSuggestion}" is perfect. You're making up for your previous mistakes!`,
                    `Yes, "${lastSuggestion}" is correct. Keep on guessing!`,
                    `Correctamundo. "${lastSuggestion}" would have been a failure in many other words, but not in this one.`,
                    `Absolimbolutely, "${lastSuggestion}" is a winner.`];
            }

            if (fails > 5) {
                return [
                    `${capitalize(verboseNumber(fails))} wrong ${plural('guess', 'guesses', fails)} already - ${verboseNumber(max)} and you're out!`,
                    `${capitalize(verboseNumber(fails))} ${plural('guess was', 'guesses were', fails)} wrong already, ${verboseNumber(max - fails)} more and you're out!`
                ];
            }

            return [
                `${capitalize(verboseNumber(fails))} wrong ${plural('guess', 'guesses', fails)}, try to guess more correctly.`,
                `${capitalize(verboseNumber(fails))} ${plural('guess was', 'guesses were', fails)}, you better start picking correct letters now.`
            ];
        }
    }

    class Word {
        constructor(letters, hint1, hint2) {
            this._letters = letters.toLowerCase();
            this._hint1 = hint1;
            this._hint2 = hint2;
        }

        letters() {
            return this._letters;
        }

        hint1() {
            return this._hint1;
        }

        hint2() {
            return this._hint2;
        }

        contains(letter) {
            return this._letters.indexOf(letter.toLowerCase()) > -1;
        }
    }

    class WordFetcher {
        constructor() {
            this.words = [];
            this.fetched = [];
        }

        add(letters, hint1, hint2) {
            this.words.push(new Word(letters, hint1, hint2));
        }

        fetch(cb) {
            if (this.words.length === 0) {
                this.words = this.fetched;
                this.fetched = [];
            }
            let word = this.words.splice(Math.floor(Math.random() * this.words.length), 1)[0];
            this.fetched.push(word);
            cb(word);
        }

        url(word) {
            return `http://www.wordthink.com/${word.letters()}/`;
        }
    }

    const wordFetcher = new WordFetcher();
    wordFetcher.add('extemporaneous', 'adj. 1. Unrehearsed. Done or said without advance preparation or thought; impromptu. 2. Prepared in advance but delivered without notes or text', 'An extemporaneous speech.');
    wordFetcher.add('furtive', 'adj. 1. Marked by quiet, caution or secrecy; taking pains to avoid being observed. 2. Characterized by stealth; surreptitious.', 'A furtive attempt to take control of the business.');
    wordFetcher.add('anecdotal', 'adj. Based on casual observations or indications rather than rigorous or scientific analysis', 'There is anecdotal evidence that the stock will soon double in price.');
    wordFetcher.add('sanguine', 'adj. Cheerfully optimistic, hopeful, or confident', 'A sanguine disposition');
    wordFetcher.add('feckless', 'adj. 1. Careless and irresponsible. “The kids were feckless during spring break.” 2. Lacking purpose or vitality; feeble or ineffective – unlikely to be successful.', '“It was a feckless attempt to make the company a success.');
    wordFetcher.add('innocuous', 'adj. 1. Having no adverse effect; harmless. 2. Not likely to offend or provoke to strong emotion; insipid.', 'The innocuous looking e-mail actually contained a virus.');
    wordFetcher.add('autonomous', 'adj. 1. Independent in mind or judgment; self-directed. 2. Not controlled by others or by outside forces; independent', 'The business divisions operate autonomously.');
    wordFetcher.add('mercurial', 'adj.  1. Quick and changeable in temperament; volatile', 'His mercurial temperament made him difficult to work for.');
    wordFetcher.add('petulant', 'adj. 1. Contemptuous in speech or behavior. 2. Unreasonably irritable or ill-tempered; rude', 'She was fired over her petulant attitude to our customers.');
    wordFetcher.add('plethora', 'n. A superabundance; an excessive amount or number', 'Upon returning from the trip, she had a plethora of calls to make.');
    wordFetcher.add('ephemeral', 'adj. 1. Lasting for a markedly brief time 2. Living or lasting only for a day, as with certain plants or insects.', 'The ephemeral nature of fashion trends.');
    wordFetcher.add('myriad', 'adj.  Constituting a very large, indefinite number; innumerable', 'The myriad snowflakes in the winter.');
    wordFetcher.add('dogmatic', 'adj. 1. Expressing rigid opinions; Prone to expressing strongly held beliefs and opinions. 2. Asserting opinions in a doctrinaire or arrogant manner; opinionated.', 'A dogmatic speech.');
    wordFetcher.add('capricious', 'adj.  Characterized by or subject to whim; impulsive and unpredictable.', 'He’s such a capricious boss I never know how he’ll react.');
    wordFetcher.add('gregarious', 'adj. 1. Seeking and enjoying the company of others; sociable.', 'She is a gregarious, outgoing person.');
    wordFetcher.add('visceral', 'adj. 1. Instinctual: proceeding from instinct rather than from reasoned thinking or intellect. 2. Emotional: characterized by or showing crude or elemental emotions.', 'A visceral business decision.');
    wordFetcher.add('auspicious', 'adj. Marked by success; prosperous. Suggesting a positive and successful future.', 'An auspicious time to purchase the stock.');
    wordFetcher.add('pensive', 'adj. Deeply, often wistfully or dreamily thoughtful. Expressive of melancholy thoughtfulness.', 'She was feeling pensive after seeing an old boyfriend.');
    wordFetcher.add('cognitive', 'adj. 1. Relating to the process of acquiring knowledge by the use of reasoning, intuition, or perception. 2. Having a basis in or reducible to empirical factual knowledge.', 'A Cognitive model for success.');
    wordFetcher.add('specious', 'adj.  1. Having the ring of truth or plausibility but actually fallacious. 2. Deceptively attractive', 'A specious argument.');
    wordFetcher.add('quixotic', 'adj. 1. Idealistic without regard to practicality; impractical. 2. Impulsive: tending to act on whims or impulses.', 'It was clearly a quixotic case against the defendant.');
    wordFetcher.add('incredulous', 'adj. 1. Skeptical; disbelieving. 2. Expressive of disbelief.', 'Most people are incredulous of stories about flying saucers.');
    wordFetcher.add('odious', 'adj. Extremely unpleasant; repulsive. Deserving of hatred or repugnance.', 'The detective said it was the most odious crime she had ever seen.');
    wordFetcher.add('acerbic', 'adj. Sharp or biting, as in character or expression.', 'The director occasionally allowed an acerbic tone to an otherwise subtle dialogue.');
    wordFetcher.add('esoteric', 'adj. 1. Difficult to understand; abstruse. 2. Not publicly disclosed; confidential. 3. Of rare, special, or unusual interest.', 'Her software’s success was based on an esoteric programming language.');
    wordFetcher.add('incongruous', 'adj. 1. Lacking in harmony; incompatible. 2. Not in agreement, as with principles; inconsistent. 3. Not in keeping with what is correct, proper, or logical; inappropriate', 'She showed incongruous behavior.');
    wordFetcher.add('ominous', 'adj. Menacing; threatening', 'Ominous black clouds');
    wordFetcher.add('anachronism', 'n. One that is out of its proper, chronological, or historical order, especially a person or practice that belongs to an earlier time.', 'A sword is an anachronism in modern warfare.');
    wordFetcher.add('nebulous', 'adj. 1. Lacking definition or definite content. 2. Lacking definite form or limits; vague', 'The test results were nebulous and determined to be unusable.');
    wordFetcher.add('exacerbate', 'transitive verb.  To make more violent, bitter, or severe; to irritate or make worse.', 'The continued delays were greatly exacerbated by the lack of workers on the project.');
    wordFetcher.add('temporal', 'adj.  Relating to, or limited by time. Lasting only for a time; not eternal.  Also: fleeting, passing, momentary, temporary, transient, short-lived', 'The beneficial effects of the loan were temporal.');
    wordFetcher.add('pragmatic', 'adj.  More concerned with practical results than with theories and principles.', 'The CEO used a pragmatic approach to making his business a success.');
    wordFetcher.add('diminutive', 'adj. Extremely small in size; tiny. A very small person or thing.', 'Although diminutive in stature, they were a formidable opponent;” “A diminutive report.');
    wordFetcher.add('laborious', 'adj.  Hard-working; industrious. Marked by or requiring long, hard work.', 'It was a laborious project, but they still kept it under budget.');
    wordFetcher.add('altruism', 'n.  Unselfish concern for the welfare of others; selflessness', 'Despite his miserly demeanor, his life is driven by Altruism');
    wordFetcher.add('copious', 'adj.  Large in quantity; abundant. Abounding in matter, thoughts, or words; wordy.', 'He took copious notes during the business meeting.');
    wordFetcher.add('ambiguous', 'adj.  Open to more than one interpretation; doubtful or uncertain.', 'The survey results were ambiguous.');
    wordFetcher.add('austere', 'adj. 1. Markedly simple without adornment or ornamentation. 2. Strict or stern in appearance or manner.', 'An austere writing style.');
    wordFetcher.add('euphemism', 'n. A mild, inoffensive expression that is substituted for one that is often considered harsh or offensive.', '“To pass away” is a euphemism for “to die.”');
    wordFetcher.add('ostensible', 'adj.  Stated or appearing to be true, but not necessarily so. Being such in appearance, plausible rather than demonstrably true or real.', 'The ostensible purpose of the trip was for business.');
    wordFetcher.add('disingenuous', 'adj. Not straightforward or candid; insincere or calculating', 'It was disingenuous of her to claim she had no financial interest in the company.');
    wordFetcher.add('duplicitous', 'adj.  Given to or marked by deliberate deceptiveness in behavior or speech.', 'They warned him not to trust the duplicitous telemarketer.');
    wordFetcher.add('derisive', 'adj. Expressing contempt or ridicule; mocking or scornful.', 'A derisive laugh.');
    wordFetcher.add('prodigious', 'adj. Remarkably or impressively great in extent, size, or degree.', 'Her prodigious sales performance resulted in a promotion.');
    wordFetcher.add('recalcitrant', 'adj. Stubborn, often defiant of authority; difficult to manage or control.', 'After months of recalcitrant behavior, the employee was terminated.');
    wordFetcher.add('anomalous', 'adj. Deviating from what is standard, normal, or expected.', 'The marketing department could not explain the anomalous sales performance.');
    wordFetcher.add('pugnacious', 'adj. 1. Quarrelsome or combative in nature; belligerent. 2. Expressing an argument or opinion very forcefully.', 'Rather than maintaining a calm demeanor, his boss was quite pugnacious.');
    wordFetcher.add('bucolic', 'adj. Of or relating to the pleasant aspects of country life.', 'He retired to a more bucolic life on his farm.');
    wordFetcher.add('placate', 'verb To appease or pacify; make (someone) less angry or hostile.', 'The customer service representative tried to placate the dissatisfied customer.');
    wordFetcher.add('atypical', 'adj.  Not conforming to type; unusual or irregular. Deviating from what is usual or common or to be expected; often somewhat odd or strange.', 'The strong sales were atypical of the normally weak market.');
    wordFetcher.add('antiquated', 'adj.  Very old; aged. Too old to be fashionable, suitable, or useful; outmoded, obsolete', 'The committee thought the marketing strategy was too antiquated to approve.');
    wordFetcher.add('ubiquitous', 'adj.  Being or seeming to be everywhere, or in all places, at the same time; omnipresent', 'Ubiquitous cell phones.');
    wordFetcher.add('fortuitous', 'adj.  Happening by accident or chance. Happening by a fortunate accident or chance. Lucky or fortunate.', 'The check could not have arrived at a more fortuitous time.');
    wordFetcher.add('insipid', 'adj.  Lacking flavor or zest; not tasty. Lacking qualities that excite, stimulate, or interest; dull.', 'The insipid play caused many to walk out of the theater.');
    wordFetcher.add('voluminous', 'adj.  Having great volume, fullness, size, or number; ample or lengthy in speech or writing.', 'Voluminous paperwork.');
    wordFetcher.add('nefarious', 'adj.  Infamous by way of being extremely wicked. Wicked in the extreme; abominable; iniquitous; atrociously villainous; execrable; detestably vile', 'His nefarious scheme cost investors millions of dollars.');
    wordFetcher.add('chagrin', ' n.  A keen feeling of mental unease, as of annoyance or embarrassment, caused by failure, disappointment, or a disconcerting event', 'He decided to take the day off, much to the chagrin of his boss.');
    wordFetcher.add('reciprocity', 'n A reciprocal condition or relationship', 'The president’s proposal calls for full reciprocity.');
    wordFetcher.add('loquacious', 'adj Very talkative; garrulous.', 'Her loquacious sales pitch lasted the entire afternoon.');
    wordFetcher.add('penurious', 'adj Extremely poor; poverty-stricken; miserly', 'The penurious family was forced from their home.');
    wordFetcher.add('myopic', 'n.  Distant objects appear blurred – Lack of discernment or long-range perspective in thinking or planning', 'Myopic thinking.');
    wordFetcher.add('rapacious', 'Adj Aggressively greedy or ravenous; plundering:', 'A rapacious salesman.');
    wordFetcher.add('mendacious', 'adj Not telling the truth; lying', 'A mendacious politician');


    const game = new HangManUI('.hangman', new Hangman(), wordFetcher);
    game.start();


})();

