import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { resolve } from "path";

let reactions = {}, jobList = [], similarityFrequency = {};
createReadStream(resolve('./reactions.csv'))
    .pipe(parse({ delimiter: ',', from_line: 2 }))
    .on('data', row => {
        let [user_id, job_id, direction] = row;

        // For each row, we need to grab the users in a particular job ==> {job_id: [user_id]}
        if (direction !== 'true') return;

        if (reactions[job_id]) {
            reactions[job_id].push(user_id);
        } else {
            reactions[job_id] = [user_id];
            jobList.push(job_id);
        }

    })
    .on('end', () => {
        // restructure the jobs to get a similarity counter for 2 distinct users 
        // ==> [user1<>user2]: [number of jobs both liked]

        jobList.forEach(job => {
            if (reactions[job].length <= 1) return;

            let users = reactions[job];
            for (let i = 0; i < users.length; i++) {
                for (let j = i + 1; j < users.length; j++) {
                    let min = Math.min(+users[i], +users[j]);
                    let max = Math.max(+users[i], +users[j]);

                    let key = `${min}<>${max}`;
                    if (similarityFrequency[key]) similarityFrequency[key]++;
                    else similarityFrequency[key] = 1;
                }
            }
        })

        // Sort the frequency in descending order to get the 2 unique users with the highest similar likes
        let similarityList = Object.keys(similarityFrequency)
        similarityList.sort((a, b) => similarityFrequency[b] - similarityFrequency[a]);

        let [user1, user2] = similarityList[0].split('<>');
        console.log(`The users with the highest similar likes are: user-${user1} and user-${user2}, with similarity of ${similarityFrequency[similarityList[0]]}.`)
    })