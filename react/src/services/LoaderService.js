const {default: axios } = require('axios')

class LoaderService {
    loadAllResources = async () => {
        return await axios.get(`/api/load/`).then(data => data)
    }
}
export default LoaderService;