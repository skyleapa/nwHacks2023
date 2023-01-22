// Planks
import { demoDataSet } from './data/demoSet'

const ScoringComponent = (live) => {
    // video dimensions
    const height = 480
    
    // baseSlope = slope graphed from elbows to tows
    // x1, y1 = coordinates of first node
    // x2, y2 = coordinates of second node
    // returns: 
    // relativeSlope: slope between (x1, y1) and (x2, y2) relative to the slope graphed from elbow to tows (more accurate)
    // regularSlope: slope if we were to graph relative to camera frame
    function findSlope(x1, y1, x2, y2, baseSlope) {

        y2 = height - y2
        y1 = height - y1

        if (baseSlope < 0) {
            baseSlope = -1 * baseSlope
        } 

        // console.log(x1, y1, x2, y2, baseSlope)

        const A = baseSlope * (x2 - x1)
        const B = Math.sqrt(Math.pow((y2 - y1), 2) + Math.pow((x2 - x1), 2))
        const a1 = Math.atan((y2 - y1) / (x2 - x1))
        const a2 = Math.atan(A / (x2 - x1))
        const a3 = a1 - a2 
        const a4 = (90 * (Math.PI) / 180) - a3
        const C = Math.sin(a3) * (B / (Math.sin(90 * (Math.PI) / 180)))
        const D = Math.sin(a4) * (B / (Math.sin(90 * (Math.PI) / 180)))

        const relativeSlope = C / D
        // console.log(relativeSlope)
        return relativeSlope
    }

    // findSlope(0, 480, 5, 477, -1/3)

    // x1, y1 = coordinates of toes
    // x2, y2 = coordinates of elbows
    // returns: slope from elbows to toes
    function findElbowsToToes(x1, y1, x2, y2) {
        y2 = height - y2
        y1 = height - y1
        return (y2 - y1) / (x2 - x1)
    }

    // returns 3 slopes given position data:
    // heel to knees
    // knees to hips
    // hips to shoulders 
    function findSlopes(rightElbow, rightShoulder, rightHip, rightKnee, rightAnkle, rightFootIndex) {
        // EDIT: using right side for now

        const baseSlope = findElbowsToToes(rightFootIndex.x, rightFootIndex.y, rightElbow.x, rightElbow.y)
        const heelToKnees = findSlope(rightAnkle.x, rightAnkle.y, rightKnee.x, rightKnee.y, baseSlope)
        const kneesToHips = findSlope(rightKnee.x, rightKnee.y, rightHip.x, rightHip.y, baseSlope)
        const hipToShoulders = findSlope(rightHip.x, rightHip.y, rightShoulder.x, rightShoulder.y, baseSlope)
        const slopes = [heelToKnees, kneesToHips, hipToShoulders]
        
        return slopes
    }

    // calculates the average 3 slopes of a dataSet
    function average(dataSet) {
        let slope1 = 0
        let slope2 = 0
        let slope3 = 0

        for (let i = 0; i < dataSet.length; i++) {
            const demo = dataSet[i]
            const rightElbowDemo = (demo.keypoints[14], demo.keypoints[14])
            const rightShoulderDemo = (demo.keypoints[12], demo.keypoints[12])
            const rightHipDemo = (demo.keypoints[24], demo.keypoints[24])
            const rightKneeDemo = (demo.keypoints[26], demo.keypoints[26])
            const rightAnkleDemo = (demo.keypoints[28], demo.keypoints[28])
            const rightFootIndexDemo = (demo.keypoints[32], live.keypoints[32])

            const [s1, s2, s3] = findSlopes(rightElbowDemo, rightShoulderDemo, rightHipDemo, rightKneeDemo, rightAnkleDemo, rightFootIndexDemo)
            // console.log(s1, s2, s3)
            slope1 += s1
            slope2 += s2
            slope3 += s3
        }

        const res = [(slope1 / dataSet.length), (slope2 / dataSet.length), (slope3 / dataSet.length)]
        // console.log(res)
        return res;
    }

    // determines how close the user is to a plank position based on x, y positions of left and right parts
    function linedUp(positionData) {
        linedUpValue = [] // values from 100 - 0 representing how close the left and right points are (0 means not close at all)

        for (let i = 0; i < 12; i += 2) {
            if (positionData[i] && positionData[i + 1]) {
                linedUpValue.push(calculateXYDistance(positionData[i], positionData[i + 1]))
            } 
        }

        let score = 0
        for (let i = 0; i < linedUpValue.length; i++) {
            score += linedUpValue[i]
        }

        return score / linedUpValues.length
    }

    // takes two positions (left and right) and the x, y coords for both. calculates the distance between positions, and returns a linedUpValue from 1 - 100.
    function linedUpValue(leftPosition, rightPosition) {
        leftX = leftPosition.x
        leftY = leftPosition.y
        rightX = rightPosition.x
        rightY = rightPosition.y

        distance = Math.sqrt(Math.pow((rightX - leftX), 2) + Math.pow((rightY - leftY), 2))
        if (distance > 80) {
            return 0
        } else {
            return 100 - distance
        }
    }

    // demoSlopes: an array containing the three ideal slopes of a plank
    // liveSlopes: an array containing the three slopes of the candidate
    // linedUpValue: a value that determines how lined up left and right positions are
    // CONSTRAINT: demoSlopes and liveSlopes must be the same length
    // returns: a score based on how closely the live slopes match the demo slopes
    function calculateScores(demoSlopes, liveSlopes, linedUpValue) {

        let percentageDifference = []
        for (let i = 0; i < demoSlopes.length; i++) {
            const demoSlope = demoSlopes[i]
            const liveSlope = liveSlopes[i]
            percentageDifference[i] = (Math.abs(demoSlope - liveSlope) / Math.abs(demoSlope)) * 3
            if (percentageDifference [i] > 100) {
                percentageDifference [i] = 100;
            }
        }

        let score = 0
        for (let i = 0; i < percentageDifference.length; i++) {
            score += 100 - percentageDifference[i]
        }

        let averageBeforeLinedUp = score / percentageDifference.length

        let finalScore = 0

        // might need to adjust
        if (linedUpValue < 50) {
            finalScore = (averageBeforeLinedUp * 0.2) + (linedUpValue * 0.8)
        } else {
            finalScore = (averageBeforeLinedUp * 0.8) + (linedUpValue * 0.2)
        }

        return finalScore
    }



    // Testing

    // live set
    if (live.keypoints) {
        const leftElbowLive = (live.keypoints[13], live.keypoints[13])
        const rightElbowLive = (live.keypoints[14], live.keypoints[14])
        const leftShoulderLive = (live.keypoints[11], live.keypoints[11])
        const rightShoulderLive = (live.keypoints[12], live.keypoints[12])
        const leftHipLive = (live.keypoints[23], live.keypoints[23])
        const rightHipLive = (live.keypoints[24], live.keypoints[24])
        const leftKneeLive = (live.keypoints[25], live.keypoints[25])
        const rightKneeLive = (live.keypoints[26], live.keypoints[26])
        const leftAnkleLive = (live.keypoints[27], live.keypoints[27])
        const rightAnkleLive = (live.keypoints[28], live.keypoints[28])
        const leftFootIndexLive = (live.keypoints[31], live.keypoints[31])
        const rightFootIndexLive = (live.keypoints[32], live.keypoints[32])
        const allPositionData = [leftElbowLive, rightElbowLive, leftShoulderLive, rightShoulderLive, leftHipLive, rightHipLive,     // contains 12 items
            leftKneeLive, rightKneeLive, leftAnkleLive, rightAnkleLive, leftFootIndexLive, rightFootIndexLive]

        // For Testing Score Calculations
        const liveStats = findSlopes(rightElbowLive, rightShoulderLive, rightHipLive, rightKneeLive, rightAnkleLive, rightFootIndexLive);
        const linedUpValue = linedUp(allPositionData);
        const demoAverage = average(demoDataSet)
        console.log("The score is: " + calculateScores(demoAverage, liveStats, linedUpValue))
        return calculateScores(demoAverage, liveStats);
    }
}

export default ScoringComponent;
