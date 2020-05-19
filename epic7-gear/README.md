
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
