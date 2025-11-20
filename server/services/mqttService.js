import mqtt from 'mqtt';
import Bin from '../models/Bin.js';

const CONFIG = {
    BROKER_URL: "mqtt://test.mosquitto.org:1883",
    TOPIC: "capstone_E09/sensors",
    BIN_HEIGHT: 50,
    MIN_DISTANCE: 5,
    MAX_WEIGHT_KG: 5,
};

class MQTTService {
    constructor(){
        this.client = null;
        this.isConnected = false;
    }

    connect() {
    this.client = mqtt.connect(CONFIG.BROKER_URL);

    this.client.on("connect", () => {
      console.log("Connected to MQTT broker");
      this.isConnected = true;
      
      this.client.subscribe(CONFIG.TOPIC, (err) => {
        if (!err) {
          console.log(`Subscribed to topic: ${CONFIG.TOPIC}`);
        } else {
          console.error("Subscribe error:", err);
        }
      });
    });

    this.client.on("error", (err) => {
      console.error(" MQTT Client Error:", err);
      this.isConnected = false;
    });

    this.client.on("close", () => {
      console.log(" MQTT connection closed");
      this.isConnected = false;
    });

    this.client.on("message", this.handleMessage.bind(this));

    return this.client;
    }

    async handleMessage(topic, message){
        if (topic !== CONFIG.TOPIC) return;

        const data = message.toString(); 
        console.log(`Data received [${topic}]: ${data}`);

        try {
            const sensorData = JSON.parse(data);

            // Ekstrak masing-masing parameter
            const distance = sensorData.distance;    // dalam cm
            const weight = sensorData.weight;        // dalam kg
            const threshold = sensorData.threshold;  // boolean

            console.log(` -> Distance: ${distance} cm`);
            console.log(` -> Weight: ${weight} kg`);
            console.log(` -> Threshold: ${threshold}`);

            const fillPercentage = this.calculateFillPercentage(distance, weight);
            console.log(` -> Calculated fill percentage: ${fillPercentage.toFixed(1)}%`);

            await this.updateBinData(fillPercentage, distance, weight, threshold);
        } catch (error) {
            console.error('Error processing MQTT data:', error.message);
            console.error('Raw data:', message.toString());
        }
    }

    calculateFillPercentage(distance, weight){
        const fillByDistance = Math.min(100, Math.max(0,
            ((CONFIG.BIN_HEIGHT - distance) / (CONFIG.BIN_HEIGHT - CONFIG.MIN_DISTANCE)) * 100
        ));

        const fillByWeight = Math.min(100, Math.max(0,
            (weight / CONFIG.MAX_WEIGHT_KG) * 100
        ));

        console.log(` -> Fill by distance: ${fillByDistance.toFixed(1)}%`);
        console.log(` -> Fill by weight: ${fillByWeight.toFixed(1)}%`);

        // const finalFillPercentage = fillByDistance;

        // Opsi 2: Gunakan weight saja
        const finalFillPercentage = fillByWeight;
        
        // Opsi 3: Gunakan rata-rata keduanya
        // const finalFillPercentage = (fillByDistance + fillPercentageByWeight) / 2;
        
        // Opsi 4: Gunakan yang lebih besar (lebih konservatif)
        // const finalFillPercentage = Math.max(fillByDistance, fillPercentageByWeight);

        return finalFillPercentage;
    }

    async updateBinData(fillPercentage, threshold){
        const bins = await Bin.find({ is_real: true });

        if (!bins || bins.length === 0) {
            console.warn('No real bins found.');
            return;
        }

        for (const bin of bins){
            const actualFill = (fillPercentage / 100) * bin.capacity;

            bin.current_fill_ga = actualFill;
            bin.current_fill_nn = actualFill;

            await bin.save();

            console.log(
                `Updated real bin "${bin.name}" (${bin.bin_id}): ` +
                `${actualFill.toFixed(1)}/${bin.capacity} kg (${fillPercentage.toFixed(1)}%)`
            );

            if (threshold) {
                console.log('THRESHOLD TRIGGERED! Bin needs attention.');
            }
        }
    }

    disconnect() {
        if (this.client) {
            console.log("Shutting down MQTT client...");
            this.client.end();
            this.isConnected = false;
        }
    }

    getStatus() {
        return {
            connected: this.isConnected,
            broker: CONFIG.BROKER_URL,
            topic: CONFIG.TOPIC,
        };
    }
}

const mqttService = new MQTTService();
export default mqttService;