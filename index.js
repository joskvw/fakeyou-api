const p = require("phin");
const { randomUUID } = require("crypto");

async function speak(voice, text) {
    let jobRequest = await p({
        url: "https://api.fakeyou.com/tts/inference",
        method: "POST",
        parse: "json",
        data: {
            uuid_idempotency_token: randomUUID(),
            tts_model_token: voice,
            inference_text: text,
        },
    });
    if (!jobRequest.body.success) {
        // Edit reply when request !== success
        await interaction.editReply({ content: `❌ You are submitting too many requests! Slow down a bit.` });
        
        return "ERROR: 0";
    }
    return await new Promise((resolve) => {
        // Inicialize count to 0
        let count = 0;
        
        let interval = setInterval(async () => {
            let res = await p({
                url:
                    "https://api.fakeyou.com/tts/job/" +
                    jobRequest.body.inference_job_token,
                method: "GET",
                parse: "json",
            });
            
            // Increment count
            count++;
            
            // Conditions to report the user of what is happening
            
            // Status === pending
            if (res.body.state.status === 'pending') await interaction.editReply({ content: `In queue... (${count}s)` });
            
            // Status !== pending = procesing
            if (res.body.state.status !== 'pending') await interaction.editReply({ content: `Processing`, });
            
            // Opcional max timeout
            if (count >= 120) {
                await interaction.editReply({ content: `❌ Maximum waiting time, try again later.` });
                
                // Opcional delete reply after reporting
                setTimeout(() => interaction.deleteReply(), 10000);
                
                // ClearInterval and exit the function
                clearInterval(interval);
            }
            
            if (!res.body.success) {
                clearInterval(interval);
                resolve("ERROR: 1");
            } else if (res.body.state.status === "complete_success") {
                clearInterval(interval);
                resolve(
                    "https://storage.googleapis.com/vocodes-public" +
                        res.body.state.maybe_public_bucket_wav_audio_path
                );
            }
        }, 1000);
    });
}
exports.speak = speak;
