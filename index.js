#!/usr/bin/env node

const fs = require('fs');
const minimist = require('minimist');
const zlib = require('zlib');
const { isDeepStrictEqual } = require('util');

const { ReplayParser, constants } = require('prismata-replay-parser');

const STANDARD_BASE_SET = [
    'Engineer',
    'Drone',
    'Conduit',
    'Blastforge',
    'Animus',
    'Forcefield',
    'Gauss Cannon',
    'Wall',
    'Steelsplitter',
    'Tarsier',
    'Rhino'
];

const STANDARD_START_POSITION = [
    {
        units: {
            Drone: 6,
            Engineer: 2,
        }
    },
    {
        units: {
            Drone: 7,
            Engineer: 2,
        }
    }
];

function loadSync(file) {
    if (file.endsWith('.gz')) {
        return zlib.gunzipSync(fs.readFileSync(file));
    }
    return fs.readFileSync(file);
}

function getTimeControl(parser) {
    function isStandard(info) {
        return info.bankDilution === 0.25 && info.increment === info.initial &&
            info.increment === info.bank;
    }

    const p1time = parser.getTimeControl(0);
    const p2time = parser.getTimeControl(1);

    if (!isDeepStrictEqual(p1time, p2time)) {
        return [
            isStandard(p1time) ? p1time.increment : p1time,
            isStandard(p2time) ? p2time.increment : p2time,
        ];
    }

    return isStandard(p1time) ? p1time.increment : p1time;
}

function getDeck(parser) {
    function isStandard(set) {
        return set.length === STANDARD_BASE_SET.length &&
            !set.some(x => !STANDARD_BASE_SET.includes(x));
    }

    const p1Deck = parser.getDeck(0);
    if (isDeepStrictEqual(p1Deck.customSupplies, { Drone: 21 })) {
        delete p1Deck.customSupplies;
    }
    if (isStandard(p1Deck.baseSet)) {
        p1Deck.baseSet = 'standard';
    }

    const p2Deck = parser.getDeck(1);
    if (isStandard(p2Deck.baseSet)) {
        p2Deck.baseSet = 'standard';
    }

    if (isDeepStrictEqual(p1Deck, p2Deck)) {
        return p1Deck;
    }
    return [p1Deck, p2Deck];
}

function getStartPosition(parser) {
    if (isDeepStrictEqual([parser.getStartPosition(0), parser.getStartPosition(1)],
        STANDARD_START_POSITION)) {
        return 'standard';
    }
    return [parser.getStartPosition(0), parser.getStartPosition(1)];
}

function collectInfo(data) {
    const parser = new ReplayParser(data);
    const state = parser.state;

    const info = {
        code: parser.getCode(),
        startTime: parser.getStartTime(),
        endTime: parser.getEndTime(),
        serverVersion: parser.getServerVersion(),
        players: [parser.getPlayerInfo(0), parser.getPlayerInfo(1)],
        gameFormat: Symbol.keyFor(parser.getGameFormat(data)),
        timeControl: getTimeControl(parser),
        deck: getDeck(parser),
        startPosition: getStartPosition(parser),
        result: {},
        turns: [],
    };

    const result = parser.getResult(data);
    info.result.endCondition = Symbol.keyFor(result.endCondition);
    switch (result.winner) {
    case null:
        info.result.winner = 'draw';
        break;
    case 0:
        info.result.winner = 'P1';
        break;
    case 1:
        info.result.winner = 'P2';
        break;
    default:
        throw new Error('Invalid winner.', result.winner);
    }

    const supplies = [{}, {}];
    let turnInfo = {};
    parser.on('initGameDone', () => {
        Object.assign(supplies[0], state.supplies[0]);
        Object.assign(supplies[1], state.supplies[1]);
    });

    parser.on('action', type => {
        if (type !== constants.ACTION_COMMIT_TURN) {
            return;
        }

        turnInfo.purchased = [];
        const player = state.activePlayer;
        Object.keys(supplies[player]).forEach(name => {
            if (supplies[player][name] !== state.supplies[player][name]) {
                for (let i = 0; i < supplies[player][name] - state.supplies[player][name]; i++) {
                    turnInfo.purchased.push(name);
                }
            }
        });
        Object.assign(supplies[player], state.supplies[player]);
    });

    parser.on('actionDone', type => {
        if (type === constants.ACTION_COMMIT_TURN) {
            info.turns.push(turnInfo);
            turnInfo = {};
        }
    });

    try {
        parser.run();
    } catch (e) {
        info.parseError = {
            message: e.toString(),
            turn: state.turnNumber,
            player: state.activePlayer,
        };
    }

    return info;
}

async function main() {
    const argv = minimist(process.argv.slice(2), { boolean: ['i', 'e'] });

    if (argv._.length === 0) {
        console.error('No input file.');
        process.exit(1);
    }

    const info = collectInfo(loadSync(argv._[0]));
    if (info.parseError && !argv.e) {
        console.error(`Parse error: ${info.parseError.message}`);
        process.exit(2);
    }
    console.info(JSON.stringify(info, null, argv.i ? 2 : 0));
}

if (!module.parent) {
    main()
        .catch(console.error);
}
