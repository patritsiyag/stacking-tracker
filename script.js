import { ethers } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "./config.js";
import { createObjectCsvWriter } from "csv-writer";

const provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com");
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
const csvWriter = createObjectCsvWriter({
    path: "staked_balances.csv",
    header: [
        { id: "address", title: "Address" },
        { id: "balance", title: "Staked Amount (ETH)" },
        { id: "stakingTime", title: "Staking Time" },
        { id: "unstakingTime", title: "Unstaking Time" },
    ],
});

function formatTimestamp(timestamp) {
    if (!timestamp || timestamp === "0") return "N/A";
    return new Date(Number(timestamp) * 1000).toUTCString();
}

async function getStakers() {
    try {
        let stakers = [];
        let index = 0;

        while (true) {
            try {
                const address = await contract.getAddresses(index);
                if (!address || address === ethers.ZeroAddress) {
                    break;
                }
                let balance = await contract.balanceOf(address);
                balance = balance ? ethers.formatUnits(balance, "ether") : "0";
                let stakingTime = "N/A";
                let unstakingTime = "N/A";

                if (contract.stakingTime) {
                    let rawStakingTime = await contract.stakingTime(address);
                    stakingTime = formatTimestamp(rawStakingTime);
                }

                if (contract.unstakingTimeOf) {
                    let rawUnstakingTime = await contract.unstakingTimeOf(address);
                    unstakingTime = formatTimestamp(rawUnstakingTime);
                }
                stakers.push({
                    address,
                    balance,
                    stakingTime,
                    unstakingTime,
                });

                index++;
            } catch (error) {
                break;
            }
        }

        if (stakers.length > 0) {
            await csvWriter.writeRecords(stakers);
            console.log("data saved to staked_balances.csv")
        } 

    } catch (error) {
        console.error("Error fetching stakers:", error);
    }
}
getStakers();
