# Prismata Replay Info

Extract info from Prismata replays to JSON format. Uses
[prismata-replay-parser](https://github.com/plampila/prismata-replay-parser).

## Status

*Output format is not stable.* Feedback is welcome.

Lot more information could be added. Have to figure out what is useful and what
is the best way to present that information.

There is an option to allow getting information from replays where parsing
fails. Instead of failing parseError field is set and information collected up
to that point is presented.

## Example Output

```json
{
  "code": "TJUwN-@aZEU",
  "startTime": "2018-05-13T17:04:05.327Z",
  "endTime": "2018-05-13T17:19:01.865Z",
  "serverVersion": 496,
  "players": [
    {
      "name": "307th",
      "bot": false,
      "rating": {
        "value": 2153.5,
        "tier": 10
      }
    },
    {
      "name": "weiseguy",
      "bot": false,
      "rating": {
        "value": 2117.1,
        "tier": 10
      }
    }
  ],
  "gameFormat": "versus",
  "timeControl": 45,
  "deck": {
    "baseSet": "standard",
    "randomSet": [
      "Endotherm Kit",
      "Deadeye Operative",
      "Gauss Fabricator",
      "Infusion Grid",
      "Trinity Drone",
      "Doomed Wall",
      "Bloodrager",
      "Omega Splitter",
      "Xaetron",
      "Hellhound",
      "Ossified Drone"
    ]
  },
  "startPosition": "standard",
  "result": {
    "endCondition": "resign",
    "winner": "P2"
  },
  "turns": [
    {
      "purchased": [
        "Drone",
        "Drone"
      ]
    },
    {
      "purchased": [
        "Drone",
        "Drone"
      ]
    },
    {
      "purchased": [
        "Drone",
        "Drone"
      ]
    },
    {
      "purchased": [
        "Drone",
        "Drone",
        "Conduit"
      ]
    },
    {
      "purchased": [
        "Drone",
        "Drone",
        "Animus"
      ]
    },
    {
      "purchased": [
        "Drone",
        "Animus",
        "Trinity Drone"
      ]
    },
    {
      "purchased": [
        "Drone",
        "Blastforge",
        "Tarsier"
      ]
    },
    {
      "purchased": [
        "Drone",
        "Drone",
        "Tarsier",
        "Tarsier"
      ]
    },
    {
      "purchased": [
        "Drone",
        "Tarsier",
        "Hellhound"
      ]
    },
    {
      "purchased": [
        "Engineer",
        "Blastforge",
        "Tarsier",
        "Rhino"
      ]
    },
    {
      "purchased": [
        "Tarsier",
        "Rhino",
        "Infusion Grid"
      ]
    },
    {
      "purchased": [
        "Forcefield",
        "Tarsier",
        "Rhino",
        "Infusion Grid"
      ]
    },
    {
      "purchased": [
        "Tarsier",
        "Rhino",
        "Infusion Grid"
      ]
    },
    {
      "purchased": [
        "Engineer",
        "Bloodrager",
        "Hellhound"
      ]
    },
    {
      "purchased": [
        "Engineer",
        "Bloodrager",
        "Hellhound"
      ]
    },
    {
      "purchased": [
        "Tarsier",
        "Tarsier",
        "Doomed Wall"
      ]
    },
    {
      "purchased": [
        "Blastforge",
        "Rhino",
        "Hellhound"
      ]
    },
    {
      "purchased": [
        "Engineer",
        "Rhino",
        "Doomed Wall"
      ]
    },
    {
      "purchased": [
        "Engineer",
        "Wall",
        "Wall",
        "Ossified Drone"
      ]
    },
    {
      "purchased": [
        "Engineer",
        "Wall",
        "Tarsier",
        "Rhino"
      ]
    },
    {
      "purchased": [
        "Wall",
        "Wall",
        "Tarsier"
      ]
    },
    {
      "purchased": [
        "Engineer",
        "Forcefield",
        "Wall",
        "Rhino",
        "Ossified Drone"
      ]
    }
  ]
}
```
