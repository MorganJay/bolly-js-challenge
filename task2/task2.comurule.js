import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { resolve } from "path";

let reactions = {}, jobList = [], similarityFrequency = {}, companyList = [], companyJobs = {};
const pushUsers = (companyJobList, jobUsersList) => {
    companyJobList = new Set([...companyJobList, ...jobUsersList])
}
const findUnionCount = (companyJobs, a, b) => {
    const res = [];
    companyJobs[b].forEach(user => {
        if (companyJobs[a].has(user)) res.push(user);
    })
    return res.length;
};

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
        createReadStream(resolve('./jobs.csv'))
            .pipe(parse({ delimiter: ',', from_line: 2 }))
            .on('data', row => {
                let [job_id, company_id] = row;

                // For each row, we need to grab the users who liked at least a job
                // in that particular company ==> { company_id: [user_id] }
                if (!reactions[job_id] || reactions[job_id].length === 0) return;

                if (companyJobs[company_id]) {
                    pushUsers(companyJobs[company_id], reactions[job_id]);
                } else {
                    companyJobs[company_id] = new Set(reactions[job_id]);
                    companyList.push(company_id);
                }

            })
            .on('end', () => {
                // restructure the jobs to get a similarity counter for 2 distinct companies 
                // ==> [company1<>company2]: [number of users that liked jobs from both companies]
                for (let i = 0; i < companyList.length; i++) {
                    if (companyJobs[companyList[i]].size === 0) continue;

                    for (let j = i + 1; j < companyList.length; j++) {
                        if (companyJobs[companyList[j]].size === 0) continue;

                        const unionOfUserCount = findUnionCount(companyJobs, companyList[i], companyList[j]);
                        if (unionOfUserCount === 0) continue;

                        let min = Math.min(+companyList[i], +companyList[j]);
                        let max = Math.max(+companyList[i], +companyList[j]);

                        let key = `${min}<>${max}`;
                        if (similarityFrequency[key]) similarityFrequency[key] += unionOfUserCount;
                        else similarityFrequency[key] = unionOfUserCount;
                    }
                }

                // Sort the frequency in descending order to get the 2 unique companies 
                // with the highest similar likes
                let similarityList = Object.keys(similarityFrequency)
                similarityList.sort((a, b) => similarityFrequency[b] - similarityFrequency[a]);

                let [company1, company2] = similarityList[0].split('<>');
                console.log(`The companies with the highest similar job likes are: company-${company1} and companies-${company2}, with similarity of ${similarityFrequency[similarityList[0]]}.`)

            })
    })