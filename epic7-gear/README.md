# Tool Link

+ en version (https://meowyih.github.io/epic7-gear/index.html?lang=en)
+ tw version (https://meowyih.github.io/epic7-gear/index.html?lang=tw)
+ cn version (https://meowyih.github.io/epic7-gear/index.html?lang=cn)

# What is this?

This is a web tool for [Epic Seven](https://epic7.smilegatemegaport.com/world) player to evalute the gear's level based on the substats.

# How it works?

There is a upper and lower bond when player "roll" a substat, which includes the default substat as well as the substat that generated during the gear's upgrade. We assign 100 points for the substat with the highest value and 0 points with lowest one. Then sum up these points to a final score. It is the gear's score shows on the tool.
The only exception is the flat substat includes attack, defense and health. We cut their score to half to reflect the gap between flat substat and the percentage substat. 

# How to use it?

1. Select the gear's level. (Lv58-71/Lv72-85/Lv86-99)
2. Select the gear's type. (Good/Rare/Heroic/Epic)
3. Select the enhanced level. (+0/+3/+6/+9/+12/+15)
4. Fill in the gear's substats.
5. Click the "Calc" button.

# How to decide which gear is worth to keep/upgrade?

1. The gear with a good total score (>75).
2. The gear's total score is not high enough, but at least one of the substat has very good value.
3. One of the substat is equal/higher than player's expectation.

Player can find all these information at the bottom of the tool's page.

# Known Issue

I am pretty sure the ranges for flat attack, flat defense and flat health are not precisely correct. The table below is the upper and lower bound I used. It just based on the 200+ gears in my inventory, which is not a very large pool.

|         |flat attack|flat defense|flat health|
|---------|-----------|------------|-----------|
|Lv58 - 71|28 - 42    |23 - 30     |124 - 180  |
|Lv72 - 85|30 - 46    |25 - 33     |147 - 200  |
|Lv86 - 99|32 - 50    |27 - 36     |170 - 220  |

# Some Data...

## Maximum score for different gears

|      |+0 |+3 |+6 |+9 |+12|+15|
|------|---|---|---|---|---|---|
|Good  |100|200|300|400|500|600|
|Rare  |200|300|400|500|600|700|
|Heroic|300|400|500|600|700|800|
|Epic  |400|500|600|700|800|900|

## Number of substats for different gears

|      |+0 |+3 |+6 |+9 |+12|+15|
|------|---|---|---|---|---|---|
|Good  |1  |2  |3  |4  |4  |4  |
|Rare  |2  |2  |2  |3  |4  |4  |
|Heroic|3  |3  |3  |3  |4  |4  |
|Epic  |4  |4  |4  |4  |4  |4  |

## Substat upperbound coefficient

|      |+0 |+3 |+6 |+9 |+12|+15|
|------|---|---|---|---|---|---|
|Good  |1  |1  |1  |1  |2  |3  |
|Rare  |1  |2  |3  |3  |3  |4  |
|Heroic|1  |2  |3  |4  |4  |5  |
|Epic  |1  |2  |3  |4  |5  |6  |

## Substat range for each roll

|         |attack%|defense%|health%|
|---------|-------|--------|-------|
|Lv58 - 71|3 - 7  |3 - 7   |3 - 7  |
|Lv72 - 85|4 - 8  |4 - 8   |4 - 8  |
|Lv86 - 99|5 - 9  |5 - 9   |5 - 9  |

|         |eff%   |eff.res%|speed  |
|---------|-------|--------|-------|
|Lv58 - 71|3 - 7  |3 - 7   |1 - 4  |
|Lv72 - 85|4 - 8  |4 - 8   |1 - 4(5) (very rare)|
|Lv86 - 99|5 - 9  |5 - 9   |2 - 5  |

|         |cri.damage|cri.chance|
|---------|----------|----------|
|Lv58 - 71|3 - 6     |2 - 4     |
|Lv72 - 85|3 - 7     |3 - 5     |
|Lv86 - 99|4 - 8     |3 - 6     |

|         |flat attack|flat defense|flat health|
|---------|-----------|------------|-----------|
|Lv58 - 71|28 - 42    |23 - 30     |124 - 180  |
|Lv72 - 85|30 - 46    |25 - 33     |147 - 202  |
|Lv86 - 99|32 - 50    |27 - 36     |170 - 220  |

## Reforge (Lv90)

|       |atk%|def%|hp% |eff%|res%|
|-------|----|----|----|----|----|
|0 roll |+1% |+1% |+1% |+1% |+1% |
|1 roll |+3% |+3% |+3% |+3% |+3% | 
|2 rolls|+4% |+4% |+4% |+4% |+4% |
|3 rolls|+5% |+5% |+5% |+5% |+5% |
|4 rolls|+7% |+7% |+7% |+7% |+7% |
|5 rolls|+8% |+8% |+8% |+8% |+8% |

|       |spd|crit.chance|crit.dmg|
|-------|---|-----------|--------|
|0 roll |+0 |+1%        |+1%     |
|1 roll |+1 |+2%        |+2%     |  
|2 rolls|+2 |+3%        |+3%     |
|3 rolls|+3 |+4%        |+4%     |
|4 rolls|+4 |+5%        |+5%     |  
|5 rolls|+4 |+6%        |+6%     |

The table for flat attack/defense/health is wrong. We use some estimate number to make the tool work.

|       |flat attack|flat defense|flat health|
|-------|-----------|------------|-----------|
|0 roll |+11        |+9          |+56        |
|1 roll |+18        |+14         |+81        |
|2 rolls|+24        |+20         |+112       |
|3 rolls|+30        |+25         |+147       |
|4 rolls|+38        |+29         |+173       |
|5 rolls|+47        |+34         |+202       |
