const { createEmployee,
        getDailyRates,
        updateDailyRates
} = require('../services/backend.service');


const createEmployeeHandler = async (req, res, next) => {
    try {
        const data = await createEmployee(req.body);
        return res.status(201).send(data);
    } catch(err) {
        next(err);
    }
}

const getDailyRatesHandler = async (req, res, next) => {
    try {
        const data = await getDailyRates(parseInt(req.params.id), req.query);
        return res.status(200).send(data);
    } catch(err) {
        next(err);
    }
}

const updateDailyRatesHandler = async (req, res, next) => {
    try {
        const data = await updateDailyRates(req.body);
        return res.status(200).send(data);
    } catch(err) {
        next(err);
    }
}

module.exports = {
    createEmployeeHandler,
    getDailyRatesHandler,
    updateDailyRatesHandler
}