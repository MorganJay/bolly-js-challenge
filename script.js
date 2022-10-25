import { createReadStream } from 'fs';
import { parse } from 'csv-parse';

const reactions = [];

createReadStream('./reactions.csv')
  .pipe(parse({ delimiter: ',', from_line: 2 }))
  .on('data', row => {
    reactions.push({
      user_id: row[0],
      job_id: row[1],
      direction: row[2] === 'true',
      dateTime: row[3],
    });
  })
  .on('end', () => {
    const userLikedJobs = reactions
      .sort((a, b) => +a.user_id - +b.user_id)
      .reduce((acc, reaction) => {
        const { user_id, job_id, direction } = reaction;
        if (direction) {
          const userData = {
            user_id: user_id,
            jobs: [job_id],
          };
          if (acc.length && acc[acc.length - 1].user_id === user_id) {
            acc[acc.length - 1].jobs.push(job_id);
          } else acc.push(userData);
        }
        return acc;
      }, []);

    const similarityList = [];
    for (let i = 0; i < userLikedJobs.length; i++) {
      const { user_id, jobs } = userLikedJobs[i];
      const userData = { user_id, jobs: [] };

      for (let j = 1; j < userLikedJobs.length; j++) {
        let count = 0;
        jobs.forEach(job => {
          if (userLikedJobs[j].jobs.includes(job)) {
            count++;
            if (userData.jobs.find(x => x.job === job))
              userData.jobs.find(x => x.job === job).count++;
            else userData.jobs.push({ job, count });

            userData.jobs.sort((a, b) => b.count - a.count);
          }
        });
      }
      if (userData.jobs.length) similarityList.push(userData);
    }

    console.log(
      similarityList.sort((a, b) => b.jobs[0].count - a.jobs[0].count)
    );

    console.log(
      `The users with highest similarity are ${similarityList[0].user_id} and ${similarityList[1].user_id}`
    );

    // const jobsLikedByUsers = reactions.reduce((acc, reaction) => {
    //   const { user_id, job_id, direction } = reaction;
    //   if (direction) {
    //     if (acc[job_id] && !acc[job_id].includes(user_id)) acc[job_id].push(user_id);
    //     else acc[job_id] = [user_id];
    //   }
    //   return acc;
    // }, {});
  })
  .on('error', error => console.error(error.message));
