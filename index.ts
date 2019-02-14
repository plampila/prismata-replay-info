#!/usr/bin/env node

import * as fs from 'fs';
import minimist from 'minimist';
import { isDeepStrictEqual } from 'util';
import * as zlib from 'zlib';

import { ActionType, EndCondition, GameFormat, Player, ReplayParser } from 'prismata-replay-parser';

const STANDARD = 'Standard';

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
    'Rhino',
];

const STANDARD_START_POSITION = [
    {
        units: {
            Drone: 6,
            Engineer: 2,
        },
    },
    {
        units: {
            Drone: 7,
            Engineer: 2,
        },
    },
];

function loadSync(file: string): Buffer {
    if (file.endsWith('.gz')) {
        return zlib.gunzipSync(fs.readFileSync(file));
    }
    return fs.readFileSync(file);
}

function getTimeControl(parser: ReplayParser): any {
    function isStandard(info: any): boolean {
        return info.bankDilution === 0.25 && info.increment === info.initial && info.increment === info.bank;
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

function getDeck(parser: ReplayParser): any {
    function isStandard(set: string[]): boolean {
        return set.length === STANDARD_BASE_SET.length && !set.some(x => !STANDARD_BASE_SET.includes(x));
    }

    const p1Deck: any = parser.getDeck(0);
    if (isDeepStrictEqual(p1Deck.customSupplies, { Drone: 21 })) {
        delete p1Deck.customSupplies;
    }
    if (isStandard(p1Deck.baseSet)) {
        p1Deck.baseSet = STANDARD;
    }

    const p2Deck: any = parser.getDeck(1);
    if (isStandard(p2Deck.baseSet)) {
        p2Deck.baseSet = STANDARD;
    }

    if (isDeepStrictEqual(p1Deck, p2Deck)) {
        return p1Deck;
    }
    return [p1Deck, p2Deck];
}

function getStartPosition(parser: ReplayParser): any {
    const startPosition = [parser.getStartPosition(Player.First), parser.getStartPosition(Player.Second)];
    if (isDeepStrictEqual(startPosition, STANDARD_START_POSITION)) {
        return STANDARD;
    }
    return startPosition;
}

interface ReplayInfo {
    code: string;
    startTime: Date;
    endTime: Date;
    serverVersion: number;
    players: any; // [PlayerInfo, PlayerInfo];
    gameFormat: string;
    timeControl: any;
    deck: any;
    startPosition: any;
    result: any;
    turns: any;
    parseError?: any;
}

function collectInfo(data: Buffer): any {
    const parser = new ReplayParser(data);
    const state = parser.state;

    const info: ReplayInfo = {
        code: parser.getCode(),
        startTime: parser.getStartTime(),
        endTime: parser.getEndTime(),
        serverVersion: parser.getServerVersion(),
        players: [parser.getPlayerInfo(Player.First), parser.getPlayerInfo(Player.Second)],
        gameFormat: GameFormat[parser.getGameFormat()],
        timeControl: getTimeControl(parser),
        deck: getDeck(parser),
        startPosition: getStartPosition(parser),
        result: {} as any,
        turns: [] as any,
    };

    const result = parser.getResult();
    info.result.endCondition = EndCondition[result.endCondition];
    switch (result.winner) {
    case undefined:
        info.result.winner = 'draw';
        break;
    case Player.First:
        info.result.winner = 'P1';
        break;
    case Player.Second:
        info.result.winner = 'P2';
        break;
    default:
        throw new Error(`Invalid winner: ${result.winner}`);
    }

    const supplies: any = [{}, {}];
    let turnInfo: any = {};
    parser.on('initGameDone', () => {
        Object.assign(supplies[0], state.getSupplies(Player.First));
        Object.assign(supplies[1], state.getSupplies(Player.Second));
    });

    parser.on('action', type => {
        if (type !== ActionType.CommitTurn) {
            return;
        }

        turnInfo.purchased = [];
        const player = state.activePlayer;
        Object.keys(supplies[player]).forEach(name => {
            if (supplies[player][name] !== state.getSupplies(player)[name]) {
                for (let i = 0; i < supplies[player][name] - state.getSupplies(player)[name]; i++) {
                    turnInfo.purchased.push(name);
                }
            }
        });
        Object.assign(supplies[player], state.getSupplies(player));
    });

    parser.on('actionDone', type => {
        if (type !== ActionType.CommitTurn) {
            return;
        }

        info.turns.push(turnInfo);
        turnInfo = {};
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

async function main(): Promise<void> {
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
    console.info(JSON.stringify(info, undefined, argv.i ? 2 : 0));
}

if (!module.parent) {
    main()
        .catch(e => {
            console.error(e);
            process.exit(3);
        });
}
