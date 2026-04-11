export function calcBMI(weight:number,height:number){

return weight / ((height/100)**2)

}

export function bmiCategory(bmi:number){

if(bmi < 18.5) return "Underweight"
if(bmi < 25) return "Normal weight"
if(bmi < 30) return "Overweight"

return "Obese"

}

export function generateDiet(weight:number){

const protein = Math.round(weight*2)

return `Sample diet plan

Protein target: ${protein}g daily

Breakfast
Oats + eggs + fruit

Lunch
Rice + chicken + vegetables

Snack
Greek yogurt + nuts

Dinner
Fish or chicken + salad
`

}

export function generateWorkout(){

return `Basic workout plan

Day 1
Chest + triceps

Day 2
Back + biceps

Day 3
Legs

Day 4
Shoulders + core

Rest and repeat.
`

}